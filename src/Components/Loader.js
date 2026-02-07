import React from 'react';
import { View, ActivityIndicator, StyleSheet, Modal, Text } from 'react-native';
import { COLORS } from '../theme/theme';

const Loader = ({ visible, message }) => {
    const containerStyle = {backgroundColor: 'rgba(0, 0, 0, 0.1)', padding: 20};

  return (
    <Modal
      transparent={true}
      contentContainerStyle={containerStyle}
      animationType="none"
      visible={visible}
      onRequestClose={() => {}}>
      <View style={styles.modalBackground}>
        <View style={styles.activityIndicatorWrapper}>
          <ActivityIndicator
            animating={visible}
            color= {COLORS.primary} // You can change the color
            size="large"
          />
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'space-around',
   backgroundColor: 'rgba(0, 0, 0, 0.5)' // Semi-transparent background
  },
  activityIndicatorWrapper: {
    //  backgroundColor: '#ffff',
    // height: 100,
    // width: 100,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  message: {
    marginTop: 10,
    color:  COLORS.primary,
    fontSize: 16
  }
});

export default Loader;
