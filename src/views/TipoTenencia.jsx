import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, Button, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import * as DocumentPicker from 'expo-document-picker';

import dbConnection from '../database/dbConnection'
import sendToBack from '../utils/httpFetch'

const TipoTenencia = () => {

  const [db, setDb] = useState(dbConnection);
  const [isLoading, setIsLoading] = useState(true);
  const [tiposTenencias, setTiposTenencias] = useState([]);
  const [currentTipoTenencia, setCurrentTipoTenencia] = useState(undefined);

  const exportDb = async () => {
    if (Platform.OS === "android") {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        const base64 = await FileSystem.readAsStringAsync(
          FileSystem.documentDirectory + 'SQLite/example.db',
          {
            encoding: FileSystem.EncodingType.Base64
          }
        );

        await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, 'example.db', 'application/octet-stream')
          .then(async (uri) => {
            await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
          })
          .catch((e) => console.log(e));
      } else {
        console.log("Permission not granted");
      }
    } else {
      await Sharing.shareAsync(FileSystem.documentDirectory + 'SQLite/example.db');
    }
  }

  const importDb = async () => {
    let result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true
    });

    if (result.type === 'success') {
      setIsLoading(true);

      if (!(await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'SQLite')).exists) {
        await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'SQLite');
      }

      const base64 = await FileSystem.readAsStringAsync(
        result.uri,
        {
          encoding: FileSystem.EncodingType.Base64
        }
      );

      await FileSystem.writeAsStringAsync(FileSystem.documentDirectory + 'SQLite/example.db', base64, { encoding: FileSystem.EncodingType.Base64 });
      await db.closeAsync();
      setDb(SQLite.openDatabase('example.db'));
    }
  };



  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql('CREATE TABLE IF NOT EXISTS tipo_tenencia (id INTEGER PRIMARY KEY AUTOINCREMENT, tipo TEXT)')
    });

    db.transaction(tx => {
      tx.executeSql('SELECT * FROM tipo_tenencia', null,
        (txObj, resultSet) => setTiposTenencias(resultSet.rows._array),
        (txObj, error) => console.log(error)
      );
    });

    setIsLoading(false);
  }, [db]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  //
  const addName = () => {
    db.transaction(tx => {
      tx.executeSql('INSERT INTO tipo_tenencia (tipo) values (?)', [currentTipoTenencia],
        (txObj, resultSet) => {
          let tiposCargados = [...tiposTenencias];
          tiposCargados.push({ id: resultSet.insertId, tipo: currentTipoTenencia });
          setTiposTenencias(tiposCargados);
          setCurrentTipoTenencia(undefined);
        },
        (txObj, error) => console.log(error)
      );
    });
  }

  const deleteName = (id) => {
    db.transaction(tx => {
      tx.executeSql('DELETE FROM tipo_tenencia WHERE id = ?', [id],
        (txObj, resultSet) => {
          if (resultSet.rowsAffected > 0) {
            let tiposCargados = [...tiposTenencias].filter(tipo => tipo.id !== id);
            setTiposTenencias(tiposCargados);
          }
        },
        (txObj, error) => console.log(error)
      );
    });
  };

  const updateName = (id) => {
    db.transaction(tx => {
      tx.executeSql('UPDATE tipo_tenencia SET tipo = ? WHERE id = ?', [currentTipoTenencia, id],
        (txObj, resultSet) => {
          if (resultSet.rowsAffected > 0) {
            let tiposCargados = [...tiposTenencias];
            const indexToUpdate = tiposCargados.findIndex(tipo => tipo.id === id);
            tiposCargados[indexToUpdate].tipo = currentTipoTenencia;
            setTiposTenencias(tiposCargados);
            setCurrentTipoTenencia(undefined);
          }
        },
        (txObj, error) => console.log(error)
      );
    });
  };

  const showNames = () => {
    return tiposTenencias.map((tipo, index) => {
      return (
        <View key={index} style={styles.row}>
          <Text>{tipo.tipo}</Text>
          <Button title='Delete' onPress={() => deleteName(tipo.id)} />
          <Button title='Update' onPress={() => updateName(tipo.id)} />
        </View>
      );
    });
  };

  //bruh
  const handleOnPress = () => {
    sendToBack(tiposTenencias)
  }


  return (
    <View style={styles.container}>
      <TextInput value={currentTipoTenencia} placeholder='tipo' onChangeText={setCurrentTipoTenencia} />
      <Button title="Add Name" onPress={addName} />
      {showNames()}
      <Button title="Export Db" onPress={exportDb} />
      <Button title="Import Db" onPress={importDb} />
      <Button title="Send to Back-End" onPress={handleOnPress} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    margin: 8
  }
});

export default TipoTenencia