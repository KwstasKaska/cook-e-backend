import {
  Arg,
  Ctx,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from 'type-graphql';
import { CookedRecipe } from '../entities/User/CookedRecipe';
import { Recipe } from '../entities/Chef/Recipe';
import { isAuth } from '../middleware/isAuth';
import { isUser } from '../middleware/isUser';
import { MyContext } from '../types';
import AppDataSource from '../app-data-source';
import { NutritionalSummary } from './types/cookedRecipe-object';

@Resolver()
export class CookedRecipeResolver {
  @Mutation(() => CookedRecipe)
  @UseMiddleware(isAuth, isUser)
  // ουσιαστικά δημιουργώ ενα αρχείο απο cookedrecipes σαν ημερολόγιο για το donut και γι αυτό δεν έχω βάλει καποιο ελεγχο για διπλότυπο, γιατί μπορεί να την εισάγει πολλές φορές
  async logCookedRecipe(
    @Arg('recipeId', () => Int) recipeId: number,
    @Ctx() { req }: MyContext,
  ): Promise<CookedRecipe> {
    const recipe = await Recipe.findOne({ where: { id: recipeId } });
    if (!recipe) {
      throw new Error('Η συνταγή δεν βρέθηκε.');
    }

    return CookedRecipe.create({
      userId: req.session.userId,
      recipeId,
    }).save();
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth, isUser)
  // για να σβήσω την μαγειρεμένη συνταγή απο την λίστα, ιδια συνθήκη ελέγχω το id του χρήστη και της μαγειρεμένης συνταγής, και την αφαιρώ απο την λίστα
  async deleteCookLog(
    @Arg('id', () => Int) id: number,
    @Ctx() { req }: MyContext,
  ): Promise<boolean> {
    const log = await CookedRecipe.findOne({
      where: { id, userId: req.session.userId },
    });

    if (!log) return false;

    await CookedRecipe.remove(log);
    return true;
  }

  @Query(() => [CookedRecipe])
  @UseMiddleware(isAuth, isUser)
  // για να δώ ολες τις αποθηκευμένες συνταγές μου, χρησιμοποιώ και pagination με limit/offset προκειμένου να υπάρχει ενα safety net.
  async myCookedRecipes(
    @Ctx() { req }: MyContext,
    @Arg('limit', () => Int, { defaultValue: 10 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<CookedRecipe[]> {
    return CookedRecipe.find({
      where: { userId: req.session.userId },
      relations: ['recipe'],
      order: { cookedAt: 'DESC' },
      take: Math.min(limit, 50),
      skip: offset,
    });
  }

  @Query(() => NutritionalSummary)
  @UseMiddleware(isAuth, isUser)
  // στην προκειμένη θελω να επιστρέψω ενα object στο οποίο θα αναγράφονται όλες οι θερμίδες και οι υποκατηγορίες τους, χρησιμοποιώ sql query λόγω των sum και count που υπάρχουν καθώς το typeorm δεν έχει κάποια ιδιότητα να τα αναγνωρίζει. επίσηςτα δηλώνω ωσ ::int κλπ επειδή μου έβγαζε error, τα εμφανιζε σαν strings και όχι σαν αριθμούς με αποτέλεσμα να πρέπει να τα δηλώσω χειροκίνητα.
  async myNutritionalSummary(
    @Ctx() { req }: MyContext,
  ): Promise<NutritionalSummary> {
    const rows = await AppDataSource.query(
      `
      SELECT
        COUNT(cr.id)::int                  AS "cookCount",
        SUM(r."caloriesTotal")::float      AS "totalCalories",
        SUM(r.protein)::float              AS "totalProtein",
        SUM(r.carbs)::float                AS "totalCarbs",
        SUM(r.fat)::float                  AS "totalFat"
      FROM cooked_recipe cr
      INNER JOIN recipe r ON r.id = cr."recipeId"
      WHERE cr."userId" = $1
        AND cr."cookedAt" >= NOW() - INTERVAL '7 days'
      `,
      [req.session.userId],
    );
    // στο where clause, παίρνω τις συναρτήσεις απο το postgresql που υπάρχουν ηδη και με βοηθάνε να ορίσω χρονικά το σήμερα με την αφαίρεση του χρονικού διαστήματος 7 ημερών

    const row = rows[0]; // επιστρέφεται πάντα ενα row ακόμα κι όταν ειναι null

    return {
      cookCount: row.cookCount ?? 0, //αν το row.cookcount είναι null ή undefined πάρε το 0, το χρησιμοποιώ σαν safety net
      totalCalories: row.totalCalories ?? 0,
      totalProtein: row.totalProtein ?? 0,
      totalCarbs: row.totalCarbs ?? 0,
      totalFat: row.totalFat ?? 0,
    };
  }
}
