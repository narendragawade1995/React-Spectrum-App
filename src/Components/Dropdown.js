


import React from "react";
import { View,StyleSheet,TouchableOpacity,Text, FlatList} from "react-native";

const Dropdown = ({filteredAccounts})=>{

       
    ( 
        <View style={styles.dropdown}>
          <FlatList
            data={filteredAccounts}
            keyExtractor={(item) => item?.account_id}
            renderItem={({ item }) => (
                <View>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => handleSelect(item)}>
                <Text style={styles.dropdownText}>{item.account_no}</Text>
              </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )

    }
    
      const styles = StyleSheet.create({
        dropdown: {
            position: 'absolute',
            top: 50, // Adjust based on your layout
            left: 10,
            right: 10,
            backgroundColor: '#fff',
            borderRadius: 5,
            elevation: 3,
            zIndex: 1000,
          },
          dropdownItem: {
            padding: 10,
          },
          dropdownText: {
            fontSize: 16,
          }
    
      })
export default Dropdown;