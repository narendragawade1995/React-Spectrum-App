import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { TextInput, Button } from 'react-native-paper';

const { width } = Dimensions.get('window');

const FilterComponent = ({ visible, onDismiss, onApply, onClear }) => {
  const slideAnim = useRef(new Animated.Value(width)).current;

  const [filters, setFilters] = React.useState({
    name: '',
    email: '',
    employeeCode: '',
    firstName: '',
    lastName: '',
    username: '',
  });

  const handleInputChange = (name, value) => {
    setFilters({ ...filters, [name]: value });
  };

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: width / 2,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [visible]);

  return (
    <>
      {visible && (
        <TouchableWithoutFeedback onPress={onDismiss}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}
      <Animated.View style={[styles.container, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.content}>
          <TextInput
            label="Name"
            mode="outlined"
            value={filters.name}
            onChangeText={(value) => handleInputChange('name', value)}
            style={styles.input}
          />
          <TextInput
            label="Email"
            mode="outlined"
            value={filters.email}
            onChangeText={(value) => handleInputChange('email', value)}
            style={styles.input}
          />
          <TextInput
            label="Employee Code"
            mode="outlined"
            value={filters.employeeCode}
            onChangeText={(value) => handleInputChange('employeeCode', value)}
            style={styles.input}
          />
          <TextInput
            label="First Name"
            mode="outlined"
            value={filters.firstName}
            onChangeText={(value) => handleInputChange('firstName', value)}
            style={styles.input}
          />
          <TextInput
            label="Last Name"
            mode="outlined"
            value={filters.lastName}
            onChangeText={(value) => handleInputChange('lastName', value)}
            style={styles.input}
          />
          <TextInput
            label="Username"
            mode="outlined"
            value={filters.username}
            onChangeText={(value) => handleInputChange('username', value)}
            style={styles.input}
          />
          <View style={styles.buttonContainer}>
            <Button mode="contained" onPress={() => onApply(filters)} style={styles.button}>
              Apply
            </Button>
            <Button mode="outlined" onPress={onClear} style={styles.button}>
              Clear
            </Button>
          </View>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: width / 2,
    height: '100%',
    backgroundColor: 'white',
    borderLeftWidth: 1,
    borderColor: '#ddd',
    zIndex: 10,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  input: {
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default FilterComponent;
