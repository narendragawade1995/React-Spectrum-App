import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Badge } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Api from '../Utilities/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../theme/theme';

const SyncIcon = ({ itemsToSync }) => {
    const [totalItems,setTotalItems] = useState(0);
    useEffect(()=>{
        numItems()
    },[totalItems])
    const numItems = ()=>{
       try {
        Api.getItem('userdetail').then(user=>{
          AsyncStorage.getItem('urlsync').then(res=>{
              res =  JSON.parse(res);
              let username = user.userDetails[0].USER_NAME;
              let arlenth = res[username].length;
              setTotalItems(arlenth);
          })
      })
       } catch (error) {
        console.log(error)
       }
    }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={()=>Api.autosync()}>
        <Icon name="sync" size={24} color={COLORS.white}  />
      </TouchableOpacity>
      {totalItems > 0 && (
        <Badge style={styles.badge}>{totalItems}</Badge>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
  },
});

export default SyncIcon;