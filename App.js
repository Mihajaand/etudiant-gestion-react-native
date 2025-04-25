import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  FlatList,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import { LineChart, PieChart } from 'react-native-chart-kit';

const App = () => {
  const [nom, setNom] = useState('');
  const [moyenne, setMoyenne] = useState(null);
  const [etudiants, setEtudiants] = useState([]);
  const [moyenneClasse, setMoyenneClasse] = useState(0);
  const [maxMoyenne, setMaxMoyenne] = useState(0);
  const [minMoyenne, setMinMoyenne] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEtudiant, setSelectedEtudiant] = useState(null);
  const [editNom, setEditNom] = useState('');
  const [editMoyenne, setEditMoyenne] = useState(null);
  const [showPieChart, setShowPieChart] = useState(false);

  const apiUrl = 'http://192.168.88.100:8000';

  useEffect(() => {
    loadEtudiants();
  }, []);

  const getObservation = (moy) => {
    if (moy >= 10) return 'admis';
    if (moy >= 5) return 'redoublant';
    return 'exclu';
  };

  const ajouter = () => {
    if (!nom || moyenne == null) return;
    axios
      .post(`${apiUrl}/add_etudiant.php`, {
        nom: nom,
        moyenne: moyenne,
      })
      .then(() => {
        setNom('');
        setMoyenne(null);
        loadEtudiants();
      });
  };

  const supprimer = (id) => {
    Alert.alert('Confirmer', 'Supprimer cet étudiant ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Oui',
        onPress: () => {
          axios.delete(`${apiUrl}/delete_etudiant.php?id=${id}`).then(() => {
            loadEtudiants();
          });
        },
      },
    ]);
  };

  const modifier = (id, oldNom, oldMoyenne) => {
    setSelectedEtudiant(id);
    setEditNom(oldNom);
    setEditMoyenne(oldMoyenne.toString());
    setModalVisible(true);
  };

  const validerModification = () => {
    axios
      .put(`${apiUrl}/update_etudiant.php`, {
        numEt: selectedEtudiant,
        nom: editNom,
        moyenne: parseFloat(editMoyenne),
      })
      .then(() => {
        setModalVisible(false);
        loadEtudiants();
      });
  };

  const moyenneClasseCalcul = () => {
    if (!etudiants.length) return 0;
    const total = etudiants.reduce((sum, e) => sum + parseFloat(e.moyenne), 0);
    return parseFloat((total / etudiants.length).toFixed(2));
  };

  const maxMoyenneCalcul = () => {
    if (!etudiants.length) return 0;
    return parseFloat(Math.max(...etudiants.map((e) => parseFloat(e.moyenne))).toFixed(2));
  };

  const minMoyenneCalcul = () => {
    if (!etudiants.length) return 0;
    return parseFloat(Math.min(...etudiants.map((e) => parseFloat(e.moyenne))).toFixed(2));
  };

  const loadEtudiants = () => {
  axios
    .get(`${apiUrl}/get_etudiants.php`)
    .then((response) => {
      const data = response.data;
      setEtudiants(data);
      const total = data.reduce((sum, e) => sum + parseFloat(e.moyenne), 0);
      const moy = parseFloat((total / data.length).toFixed(2));
      const max = parseFloat(Math.max(...data.map((e) => parseFloat(e.moyenne))).toFixed(2));
      const min = parseFloat(Math.min(...data.map((e) => parseFloat(e.moyenne))).toFixed(2));
      setMoyenneClasse(moy);
      setMaxMoyenne(max);
      setMinMoyenne(min);
    })
    .catch((error) => {
      console.error('Erreur de chargement', error);
    });
};


  const toggleChart = () => {
    setShowPieChart(!showPieChart);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Gestion Étudiants</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          value={nom}
          onChangeText={setNom}
          placeholder="Nom"
        />
        <TextInput
          style={styles.input}
          value={moyenne ? moyenne.toString() : ''}
          onChangeText={
            (text) => setMoyenne(parseFloat(text))}
          placeholder="Moyenne"
          keyboardType="decimal-pad"
        />
        <Button style={styles.statText} color="#3CB371" title="Ajouter ➕" onPress={ajouter} />
      </View>

      <FlatList
        data={etudiants}
        keyExtractor={(item) => item.numEt.toString()}
        renderItem={({ item }) => (
          <View style={styles.studentRow}>
            <Text style={styles.studentText}>{item.nom}</Text>
            <Text style={styles.studentText}>{item.moyenne}</Text>
            <Text style={styles.studentText}>{getObservation(item.moyenne)}</Text>
            <View style={styles.actions}>
              <Button title="✏️" onPress={() => modifier(item.numEt, item.nom, item.moyenne)} />
              <Button title="🗑️" onPress={() => supprimer(item.numEt)} color="red" />
            </View>
          </View>
        )}
      />

      <View style={styles.stats}>
        <Text style={styles.statText}>Moyenne de classe : {moyenneClasse}</Text>
        <Text style={styles.statText}>Max : {maxMoyenne}</Text>
        <Text style={styles.statText}>Min : {minMoyenne}</Text>
      </View>

      {showPieChart ? (
        <PieChart
          data={[
            {
              name: 'Moy. Classe',
              population: moyenneClasse,
              color: '#3CB371',
              legendFontColor: '#333',
              legendFontSize: 15,
            },
            {
              name: 'Moy. Maximum',
              population: maxMoyenne,
              color: '#2196F3',
              legendFontColor: '#333',
              legendFontSize: 15,
            },
            {
              name: 'Moy. Minimum',
              population: minMoyenne,
              color: '#F44336',
              legendFontColor: '#333',
              legendFontSize: 15,
            },
          ]}
          width={Dimensions.get('window').width - 20}
          height={175}
          chartConfig={{
            color: () => `white`,
          }}
          accessor="population"
          backgroundColor="white"
          paddingLeft="0"
          absolute
        />
      ) : (
        <LineChart
          data={{
            labels: ['Moyenne classe', 'Min', 'Max'],
            datasets: [{ data: [moyenneClasse, minMoyenne, maxMoyenne] }],
          }}
          width={Dimensions.get('window').width - 20}
          height={220}
          chartConfig={{
            backgroundColor: '#e26a00', // #e26a00 ORANGE COOL
            backgroundGradientFrom: '#3CB371',
            backgroundGradientTo: '#02f26d',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          }}
          style={styles.chart}
        />
      )}

      <Button color="#3CB371" title={showPieChart ? 'Voir Histogramme' : 'Voir Camembert'} onPress={toggleChart} />

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.headerText}>Modifier l'étudiant</Text>
            <TextInput
              style={styles.inputTwo}
              value={editNom}
              onChangeText={setEditNom}
              placeholder="Nom"
            />
            <TextInput
              style={styles.inputTwo}
              value={editMoyenne}
              onChangeText={setEditMoyenne}
              placeholder="Moyenne"
              keyboardType="numeric"
            />
            <View style={styles.buttonContainer}>
  <Button title="Valider" onPress={validerModification} />
  <Button title="Annuler" onPress={() => setModalVisible(false)} color="red" />
</View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  header: {
    backgroundColor: '#3CB371',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  headerText: {
    color: 'white',
    fontSize: 24,
    textAlign: 'center',
  },
  form: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  inputTwo: {
    backgroundColor: '#3CB371', // Fond vert clair inspiré de #3CB371
    borderWidth: 1,
    borderColor: '#2C8C55', // Une teinte plus foncée pour le bord
    padding: 12,
    marginBottom: 15,
    borderRadius: 8, // Coins plus arrondis
    shadowColor: '#000', // Ombre de l'élément
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4, // Ombre pour Android
    color: '#fff', // Texte en blanc pour le contraste
  },
  
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3CB371', // Fond vert
    padding: 15,
    borderRadius: 10,
    margin: 10,
    shadowColor: '#000', // Ombre
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5, // Android
  },
  
  studentText: {
    flex: 1,
    fontSize: 16,
    color: '#fff', // Variante foncée de #3CB371 pour le texte
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  stats: {
    backgroundColor: '#3CB371', // Fond vert
    padding: 15,
    borderRadius: 10, // Coins arrondis
    margin: 10, // Marge autour de la vue
    shadowColor: '#000', // Ombre de l'élément
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5, // Ombre pour Android
  },
  statText: {
    color: 'white', // Texte en blanc
    fontSize: 18,
    marginBottom: 10, // Espacement entre les lignes de texte
    fontWeight: 'bold',
  },
  chart: {
    marginTop: 20,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000', // Ombre de l'élément
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5, // Ombre pour Android
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#3CB371', // Fond vert harmonisé
    padding: 20,
    borderRadius: 10,
    margin: 10,
    shadowColor: '#000', // Ombre foncée
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 4,
    elevation: 6, // Ombre Android
  },
  buttonContainer: {
    flexDirection: 'column', // Pour disposer les boutons horizontalement
    justifyContent: 'space-between', // Espacement automatique entre les boutons
    marginTop: 10, // Optionnel, si tu veux un espace au-dessus
    marginBottom: 10,
    gap:8 // Optionnel, si tu veux un espace au-dessus
  },
  
  
});

export default App;
