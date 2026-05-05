import {
  AddArticleInput,
  UpdateArticleInput,
} from '../resolvers/types/article-input';

export const validateArticle = (data: AddArticleInput) => {
  if (!data.title)
    return [{ field: 'title', message: 'error.article_title_required' }];
  if (!data.text)
    return [{ field: 'text', message: 'error.article_text_required' }];
  return null;
};

export const validateUpdateArticle = (data: UpdateArticleInput) => {
  if (data.title !== undefined && !data.title)
    return [{ field: 'title', message: 'error.article_title_required' }];
  if (data.text !== undefined && !data.text)
    return [{ field: 'text', message: 'error.article_text_required' }];
  return null;
};
