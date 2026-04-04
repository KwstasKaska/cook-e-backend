import {
  AddArticleInput,
  UpdateArticleInput,
} from '../resolvers/types/article-input';

export const validateArticle = (data: AddArticleInput) => {
  if (!data.title) {
    return [{ field: 'title', message: 'Eισάγετε τίτλο για το άρθρο σας' }];
  }
  if (!data.text) {
    return [
      { field: 'text', message: 'Eισάγετε περιεχόμενο για το άρθρο σας' },
    ];
  }
  return null;
};

export const validateUpdateArticle = (data: UpdateArticleInput) => {
  if (data.title !== undefined && !data.title) {
    return [{ field: 'title', message: 'Eισάγετε τίτλο για το άρθρο σας' }];
  }
  if (data.text !== undefined && !data.text) {
    return [
      { field: 'text', message: 'Eισάγετε περιεχόμενο για το άρθρο σας' },
    ];
  }
  return null;
};
