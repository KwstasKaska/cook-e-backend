import {
  Arg,
  Ctx,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from 'type-graphql';
import { Article } from '../entities/Nutritionist/Article';
import { AddArticleInput, UpdateArticleInput } from './types/article-input';
import { MyContext } from '../types';
import { isAuth } from '../middleware/isAuth';
import { isNutr } from '../middleware/isNutr';
import AppDataSource from '../app-data-source';
import { ArticleResponse } from './types/article-object';
import { validateArticle } from '../utils/validateArticle';
import { FileUpload, GraphQLUpload } from 'graphql-upload-minimal';
import { createWriteStream } from 'fs';
import path from 'path';

@Resolver(Article)
export class ArticleResolver {
  @Query(() => [Article])
  async articles(@Ctx() { req }: MyContext): Promise<Article[]> {
    const nutritionistArticles = await AppDataSource.query(
      ` select a.* ,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'email', u.email          
          ) AS  creator
      from article a 
      inner join public.user u ON u.id = a."creatorId"
      where u.role = 'nutritionist' AND u.id = '$1'
      order by a."createdAt" DESC`,
      [req.session.userId],
    );

    return nutritionistArticles;
  }

  @Query(() => Article, { nullable: true })
  article(@Arg('id', () => Int) id: number): Promise<Article | null> {
    return Article.findOne({ where: { id } });
  }

  @Mutation(() => ArticleResponse)
  @UseMiddleware(isAuth, isNutr)
  async createArticle(
    @Arg('data') data: AddArticleInput,
    @Arg('picture', () => GraphQLUpload) picture: FileUpload,
    @Ctx() { req }: MyContext,
  ): Promise<ArticleResponse> {
    const errors = validateArticle(data);

    if (errors) {
      return { errors };
    }
    const { createReadStream, filename } = picture;
    const imagePath = path.join(__dirname, `../../public/images/${filename}`);

    return new Promise(async (resolve, reject) => {
      createReadStream()
        .pipe(createWriteStream(imagePath))
        .on('finish', async () => {
          const article = await Article.create({
            ...data,
            creatorId: req.session.userId,
            image: `http:localhost:4000/images/${filename}`,
          }).save();

          resolve({ article });
        })
        .on('error', (error) => {
          console.error('Error writing file:', error);
          reject(false);
        });
    });
  }

  @Mutation(() => ArticleResponse)
  @UseMiddleware(isAuth, isNutr)
  async updateArticle(
    @Arg('data') data: UpdateArticleInput,
    @Arg('picture', () => GraphQLUpload) picture: FileUpload,
    @Ctx() { req }: MyContext,
  ): Promise<ArticleResponse | null> {
    const errors = validateArticle(data);
    if (errors) {
      return { errors };
    }
    let updatedFields: any = {
      title: data.title,
      text: data.text,
    };

    if (picture) {
      const { createReadStream, filename } = picture;
      const imagePath = path.join(__dirname, `../../public/images/${filename}`);

      await new Promise<void>((resolve, reject) => {
        createReadStream()
          .pipe(createWriteStream(imagePath))
          .on('finish', () => resolve())
          .on('error', (error) => {
            console.error('Error writing file:', error);
            reject(error);
          });
      });

      updatedFields.image = `http:localhost:4000/images/${filename}`;
    }

    const result = await AppDataSource.createQueryBuilder()
      .update(Article)
      .set(updatedFields)
      .where('id = :id AND "creatorId" = :creatorId', {
        id: data.id,
        creatorId: req.session.userId,
      })
      .returning('*')
      .execute();

    return { article: result.raw[0] };
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth, isNutr)
  async deleteArticle(
    @Arg('id', () => Int) id: number,
    @Ctx() { req }: MyContext,
  ): Promise<boolean> {
    const article = await Article.findOne({
      where: {
        id,
        creatorId: req.session.userId,
      },
    });

    if (!article) {
      // Δεν βρέθηκε ή δεν ανήκει στον διατροφολόγο
      return false;
    }

    await Article.delete({ id });
    return true;
  }

  // @Mutation(() => UploadImage)
  // async uploadImage(
  //   @Arg('picture', () => GraphQLUpload)
  //   { createReadStream, filename }: FileUpload
  // ): Promise<UploadImage> {
  //   const imagePath = __dirname + `/../../images/${filename}`;

  //   return new Promise(async (resolve, reject) =>
  //     createReadStream()
  //       .pipe(createWriteStream(imagePath))
  //       .on('finish', () =>
  //         resolve({ url: `http://localhost:4000/images/${filename}` })
  //       )
  //       .on('error', () => reject(false))
  //   );
  // }
}
