import path from 'path';
import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
  type: 'postgres', //δηλώνω τον τύπο της βάσης μου
  url: process.env.DATABASE_URL, //δηλώνω τα credentials της βάσης μου τοπικά προκειμένου να συνδέομαι και τα κρατάω σε env αρχείο για να μην είναι προσβάσιμα σε τρίτους
  logging: false, //καθώς δεν θέλω να κάνει error logging.
  synchronize: true, //προκειμένου να δηλώνω σε lcl επίπεδο αν θέλω να γίνονται auto generated αλλαγές στους πίνακες.
  //SSL μόνο σε prod, όχι locally προκειμένου να μην επαληθεύσω τον server που κάνω hosting, στην προκειμένη στο neon
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false } //ουσιαστικά κάνει κρυπτογράφημένη σύνδεση, αλλά επειδή δεν ελέγχο εγώ το certificate στο production, η αυστηρή επαλήθευση που ακολουθείται για δημιουργόυσε πρόβλημα στην σύνδεση
      : false,
  entities: [path.join(__dirname + '/entities/*/*{.js,.ts}')], //δηλώνω ποιες οντότητες θα φαίνονται στην βάση και θα δημιουργούνται
  migrations: [path.join(__dirname + '/migrations/*')], //δηλώνω ποια migration, σε περίπτωση που θέλω να αλλάξω κάτι σε έναν πίνακα ή entity
});

export default AppDataSource;
