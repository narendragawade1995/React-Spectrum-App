import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View, ScrollView } from "react-native";
import Api from "../Utilities/apiService";
import { List, Text, TextInput } from "react-native-paper";
import { styles } from './SecureData';
import { COLORS } from "../theme/theme";
import { Dropdown } from 'react-native-paper-dropdown';
import { useDispatch, useSelector } from "react-redux";
import unionBy from 'lodash/unionBy'
import { addFilters } from "../Redux/Slicer/UserSlice";

let customdebounce = (fun,delay)=>{
  let timeoutid;  

  return (...args)=>{
    clearTimeout(timeoutid)
    timeoutid = setTimeout(() => {
      fun(...args)
    }, delay);
  }
}

const FilterPanel = (props) => {
  const { togglePanel, applyFilters, filterflag } = props;
  const {secure:{borrowerdetails,trustcodelist,dispositionlist,sellingbanklist,zonelist}} = useSelector(state=>state.USER);
  const dispatch = useDispatch()
  const [filters, setFilters] = useState({
    customer_name: '',
    accountNumber: '',
    virtual_number: '',
    trust_name: '',
    selling_bank: '',
    disposition:'',
    disposition_date:''
  });

  const [suggestions, setSuggestion] = useState({
    'trust_name': [], 
    'selling_bank': [],
    'zonelist':[],
    'customer_name': [],
    'virtual_number': [],
    'disposition':[],
    
  });

  useEffect(()=>{
    setSuggestion(prv=>{
      return {...prv,
        'trust_name': trustcodelist, 'selling_bank': sellingbanklist,'zonelist':zonelist,'customer_name': [],
        'virtual_number': [],'disposition':dispositionlist}
    })
  },[trustcodelist])

  const handleFilterChange = (key = '', value = '') => {
    setSuggestion(prev => ({ ...prev, [key]: [] }));
    setFilters(prevFilters => ({ ...prevFilters, [key]: value }));
    if(value.length > 2){
      customdebounce(suggestionslist(key,value),5000);
    }
   
  };

  const clearsuggestion = (item, key) => {
      setSuggestion(prv => ({ ...prv, [key]: [] }));
      setFilters(prv => ({ ...prv, [key]: item.value }));
  };

  const searchData = () => {
    console.log("---------secure data call---")
    let params = {};
    for (let key in filters) {
      if (filters[key] !== '') {
        params[key] = filters[key];
      }
    }
    Object.keys(params).length > 0 ? filterflag(true) : filterflag(false);
    params = { ...params, isfromCovex: false, pageIndex: 0, pageSize: 20 };
    dispatch(addFilters(params))
    applyFilters(params);
  };

  const btnCancel = () => {
    setFilters({
      customer_name: '',
      accountNumber: '',
      virtual_number: '',
      trust_name: '',
      selling_bank: '',
      disposition:'',
      disposition_date:''
    });
    filterflag(false);
    togglePanel();
  };

  const renderSuggestion = ({ item }) => {
    return (
      <TouchableOpacity onPress={() => clearsuggestion(item, 'customer_name')}>
        <List.Item title={item.label} />
      </TouchableOpacity>
    );
  };

  const suggestionslist = (key, value) => {
    let mapping = {
      'customer_name': 'customer_name',
    };
    Api.send({ from: 'search', [mapping[key]]: value }, 'secure_borrowerdetails/secure_borrowerdetailsData')
      .then(resp => {
      
        setSuggestion(prv => ({
          ...prv,
          'customer_name': resp['ArrayOfResponse'].map(itm => ({ label: itm.customer_name, value: itm.customer_name })),
          // 'trustCode': resp['ArrayOfResponse'].map(itm => ({ label: itm.trust, value: itm.trust })),
        }));
      })
      .catch(err => { console.log(err); });
  };

  const onselected = (item,key='') => {
    
      setFilters(prevFilters => ({ ...prevFilters, [key]: item }));
    
    };

  return (
    <View style={localStyles.container}>
    
        <View style={localStyles.inputContainer}>
          <TextInput
            label="Borrower Name"
            value={filters.customer_name}
            onChangeText={(text) => handleFilterChange('customer_name', text)}
            style={[styles.input, localStyles.input]}
            mode="outlined"
          />
          {suggestions['customer_name'].length > 0 && (
            <View style={localStyles.suggestionContainer}>
              <FlatList
                data={suggestions['customer_name']}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderSuggestion}
                nestedScrollEnabled
              />
            </View>
          )}
        </View>
        <Dropdown
          hideMenuHeader={true}
          style={[styles.input, localStyles.input]}
          label="Trust Code"
          options={suggestions.trust_name}
          mode='outlined'
          value={filters.trust_name}
          // key={(item,index)=>index.toString()}
          onSelect={(item)=>onselected(item,'trust_name')}
        />
        <Dropdown
          hideMenuHeader={true}
          style={[styles.input, localStyles.input]}
          label="Selling Name"
          options={suggestions['selling_bank']}
          mode='outlined'
          value={filters.selling_bank}
          // key={(item,index)=>index.toString()}
          onSelect={(item)=>onselected(item,'selling_bank')}
        />
        {/* Add more filter inputs here */}
        <Dropdown
          hideMenuHeader={true}
          style={[styles.input, localStyles.input]}
          label="Disposition"
          options={suggestions['disposition']}
          mode='outlined'
          value={filters.disposition}
          // key={(item,index)=>index.toString()}
          onSelect={(item)=>onselected(item,'disposition')}
        />
         <Dropdown
          hideMenuHeader={true}
          style={[styles.input, localStyles.input]}
          label="Zone"
          options={suggestions['zonelist']}
          mode='outlined'
          value={filters.disposition_date}
          // key={(item,index)=>index.toString()}
          onSelect={(item)=>onselected(item,'disposition_date')}
        />
        <TextInput
            label="Virtual Number"
            value={filters.virtual_number}
            style={[styles.input, localStyles.input]}
            onChangeText={(text) => handleFilterChange('virtual_number', text)}
            mode="outlined"
          /> 
          {suggestions['virtual_number'].length > 0 && (
            <View style={localStyles.suggestionContainer}>
              <FlatList
                data={suggestions['virtual_number']}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderSuggestion}
                nestedScrollEnabled
              />
            </View>
          )}
      <View style={localStyles.buttonContainer}>
        <TouchableOpacity onPress={searchData} style={localStyles.button}>
          <Text style={localStyles.buttonText}>Apply Filters</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={btnCancel} style={localStyles.button}>
          <Text style={localStyles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 5,
  },
  scrollView: {
    flex: 1,
  },
  inputContainer: {
    position: 'relative',
    zIndex: 1,
    marginBottom: 10,
  },
  input: {
    marginBottom: 10,
  },
  suggestionContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: 200,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 5,
    zIndex: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    // justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
  },
});

export default FilterPanel;