import React, { useState, useEffect } from 'react';
import { View, StyleSheet  } from 'react-native';
import Borrowerlist from '../borrowerlist/borrwerdata';
import { COLORS } from '../../theme/theme'


const Borrowerdetails = ({ navigation }) => {
  

  return (
    <View style={styles.maincontainer}>
       <Borrowerlist securelist={false}  navigation={navigation}/> 
    </View>
  );
};

const styles = StyleSheet.create({
  maincontainer: {
    flex: 1,
    backgroundColor: COLORS.geryl,
    position: 'relative',
    paddingBottom: 10,
  },
   
});

export default Borrowerdetails;
