import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { COLORS } from '../theme/theme';

const SkeletonLoader = () => {
  return (
    <View style={styles.container}>
      <View style={styles.searchBarSkeleton} />
      <Card style={styles.cardSkeleton}>
        <View style={styles.row}>
          <View style={styles.column}>
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, { width: '80%' }]} />
          </View>
          <View style={styles.column}>
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, { width: '80%' }]} />
          </View>
        </View>
        <View style={[styles.row, { marginTop: 20 }]}>
          <View style={styles.column}>
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, { width: '80%' }]} />
          </View>
          <View style={styles.column}>
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, { width: '80%' }]} />
          </View>
        </View>
        <View style={[styles.row, { marginTop: 20 }]}>
          <View style={styles.column}>
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, { width: '80%' }]} />
          </View>
          <View style={styles.column}>
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, { width: '80%' }]} />
          </View>
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: COLORS.bg,
  },
  searchBarSkeleton: {
    height: 40,
    backgroundColor: COLORS.bg,
    borderRadius: 13,
    // marginBottom: 10,
  },
  cardSkeleton: {
    padding: 15,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    marginRight: 10,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: COLORS.lightGrey,
    borderRadius: 4,
    marginBottom: 8,
  },
});

export default SkeletonLoader;