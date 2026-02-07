import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { Button, Text } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import Api from '../Utilities/apiService';

const AccountSearch = ({route}) => {
  const [search, setSearch] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [isFocus, setIsFocus] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const navigation = useNavigation();
  

  useEffect(() => {
    if (search.length >= 3) {
      fetchAccounts();
    } else {
      setAccounts([]);
    }
  }, [search]);

const addselectedaccount = (val)=>{
  console.log({val});
  setIsFocus(true)
  setSelectedAccount(val)
}

  const fetchAccounts = async () => {
    try {
       let result = await Api.send({"accountno": search,"from": "search"} ,'secure_borrowerdetails/secure_borrowerdetailsData');   
      
        setAccounts(result.ArrayOfResponse.map(account => ({ label: account.account_no, value: account.account_no })));
    } catch (error) {
        console.log(error)
    }
  };

  const handleNext = () => {
    if (selectedAccount) {
      navigation.navigate('Disposition', { accountId: selectedAccount });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account Search</Text>
      <Dropdown
        style={styles.dropdown}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        data={accounts}
        search
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder={!isFocus ? "Search accounts":selectedAccount}
        searchPlaceholder="Enter 3 or more characters"
        value={selectedAccount}
        onChange={item => addselectedaccount(item.value)}
        onChangeText={text => setSearch(text)}
      />
      <Button
        mode="contained"
        onPress={handleNext}
        style={styles.button}
        disabled={!selectedAccount}
      >
        Next
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  dropdown: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  placeholderStyle: {
    fontSize: 16,
    color: 'gray',
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  button: {
    marginTop: 20,
    paddingVertical: 8,
  },
});

export default AccountSearch;