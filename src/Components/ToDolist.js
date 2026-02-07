import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card, Title, Paragraph, Button, Text, IconButton } from 'react-native-paper';

// Dummy data generator
const generateDummyData = (start, end) => {
  return Array.from({ length: end - start + 1 }, (_, index) => ({
    id: `${start + index}`,
    accountNumber: `ACC${(start + index).toString().padStart(3, '0')}`,
    borrowerNameTrust: `Trust ${start + index}`,
    sellingName: `Bank ${String.fromCharCode(65 + (index % 26))}`,
    allocateTo: `Team ${(index % 3) + 1}`,
  }));
};

const Todolist = () => {
  const [data, setData] = useState([]);
  const [selectedCards, setSelectedCards] = useState({});
  const [selectionMode, setSelectionMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadMoreData = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newData = generateDummyData((page - 1) * 10 + 1, page * 10);
    
    setData(prevData => [...prevData, ...newData]);
    setPage(prevPage => prevPage + 1);
    setLoading(false);

    // For demonstration, let's say we have a total of 50 items
    if (page * 10 >= 50) {
      setHasMore(false);
    }
  };

  useEffect(() => {
    loadMoreData();
  }, []);

  const toggleSelectionMode = (id) => {
    
    setSelectionMode(true);
    toggleCardSelection(id);
  };

  const toggleCardSelection = (id) => {
    
    setSelectedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));

  };

  const isAnyCardSelected = Object.values(selectedCards).some(Boolean);

  const markAsCompleted = () => {
    const selectedIds = Object.keys(selectedCards).filter(id => selectedCards[id]);
    console.log('Marking as completed:', selectedIds);
    // Here you would typically call your API
    // For example: Api.send({ taskIds: selectedIds }, 'multiple/tasks/completed');
    
    setData(prevData => prevData.filter(item => !selectedIds.includes(item.id)));
    setSelectedCards({});
    setSelectionMode(false);
  };

  const exitSelectionMode = () => {
    setSelectedCards({});
    setSelectionMode(false);
  };

  const renderCard = (item) => (
    <TouchableOpacity
      key={item.id}
      onLongPress={() => toggleSelectionMode(item.id)}
      onPress={() => selectionMode && toggleCardSelection(item.id)}
      delayLongPress={300}
    >
      <Card 
        style={[
          styles.card,
          selectedCards[item.id] && styles.selectedCard
        ]}
      >
        <Card.Content>
          {selectionMode && (
            <View style={styles.checkboxContainer}>
              <IconButton
                icon={selectedCards[item.id] ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={24}
                color={selectedCards[item.id] ? '#007bff' : '#000'}
              />
            </View>
          )}
          <Title>{item.accountNumber}</Title>
          <Paragraph>Borrower Name Trust: {item.borrowerNameTrust}</Paragraph>
          <Paragraph>Selling Name: {item.sellingName}</Paragraph>
          <Paragraph>Allocate to: {item.allocateTo}</Paragraph>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="large" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {selectionMode && (
        <View style={styles.topBar}>
          <Button mode="contained" onPress={markAsCompleted} disabled={!isAnyCardSelected}>
            Mark as Completed ({Object.values(selectedCards).filter(Boolean).length})
          </Button>
          <Button mode="outlined" onPress={exitSelectionMode} style={styles.cancelButton}>
            Cancel
          </Button>
        </View>
      )}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        onScroll={({ nativeEvent }) => {
          if (isCloseToBottom(nativeEvent)) {
            loadMoreData();
          }
        }}
        scrollEventThrottle={400}
      >
        {data.map(renderCard)}
        {renderFooter()}
        {!hasMore && (
          <Text style={styles.endMessage}>No more tasks to load</Text>
        )}
      </ScrollView>
    </View>
  );
};

const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
  const paddingToBottom = 20;
  return layoutMeasurement.height + contentOffset.y >=
    contentSize.height - paddingToBottom;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 8,
  },
  selectedCard: {
    backgroundColor: '#e6f2ff',
    borderColor: '#007bff',
    borderWidth: 2,
  },
  topBar: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelButton: {
    marginLeft: 10,
  },
  checkboxContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
  footerLoader: {
    marginVertical: 20,
    alignItems: 'center',
  },
  endMessage: {
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
  },
});

export default Todolist;