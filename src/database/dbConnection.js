import * as SQLite from 'expo-sqlite'

const dbConnection = () => {

  return SQLite.openDatabase('example.db');

/*   db.exec([{ sql: 'PRAGMA foreign_keys = ON;', args: [] }], false, () =>
    console.log('Foreign keys turned on')
  ); */

}

export default dbConnection