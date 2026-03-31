import { AddArticleInput } from '../resolvers/types/article-input';

export const validateArticle = (data: AddArticleInput) => {
  if (!data.title) {
    return [
      {
        field: 'title',
        message: 'Eισάγετε τίτλο για το άρθρο σας',
      },
    ];
  }
  if (!data.text) {
    return [
      {
        field: 'text',
        message: 'Eισάγετε περιεχόμενο για το άρθρο σας',
      },
    ];
  }
  // if (!data.image) {
  //   return [
  //     {
  //       field: 'image',
  //       message: 'Προσθέστε μια εικόνα για το άρθρο σας',
  //     },
  //   ];
  // }

  return null;
};
