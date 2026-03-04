import React, { useState ,useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,FlatList
} from 'react-native';
import {
  Appbar,
  Card,
  List,
  Divider,
  IconButton,
  Surface,
  useTheme,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/theme';

const AccountDetails = ({ navigation }) => {
  const theme = useTheme();
  const [expandedSections, setExpandedSections] = useState({});

  const navigation2 = useNavigation();
  useLayoutEffect(() => {
    navigation2.setOptions({
      headerShown: false,
    });
  }, [navigation2]);
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

    const agentDetails = [
    {
      id: 1,
      status: 'ACTIVE',
      code: 'W1234588',
      name: 'Rajesh Kumar',
      company: 'Tata AIA Life Insurance Company Ltd',
      contactNumber: '+91-9876543210',
      email: 'rajesh.kumar@tataaia.com',
      serviceBranch: 'TATA AIA Mumbai - Andheri Mumbai',
      joinDate: '15-Mar-2018',
      experience: '6 Years',
      rating: 4.8,
      specialization: 'ULIP & Term Plans'
    },
    {
      id: 2,
      status: 'ACTIVE',
      code: 'W5678901',
      name: 'Priya Sharma',
      company: 'Tata AIA Life Insurance Company Ltd',
      contactNumber: '+91-9876543211',
      email: 'priya.sharma@tataaia.com',
      serviceBranch: 'TATA AIA Mumbai - Bandra Mumbai',
      joinDate: '10-Jan-2020',
      experience: '4 Years',
      rating: 4.9,
      specialization: 'Health & Child Plans'
    }
  ];
  const sections = [
    {
      id: 'basic',
      title: 'Financial View',
      icon: 'shield-check'
    
    },
    {
      id: 'personal',
      title: 'Customer multiple account view',
      icon: 'account',
    
    },
    {
      id: 'insured',
      title: 'Collateral View',
      icon: 'shield-account' 
    },
    {
      id: 'payment',
      title: 'Payment Receipt',
      icon: 'bank' 
    },
    {
      id: 'Settlement Balances',
      title: 'Settlement Balances',
      icon: 'account-multiple' 
    },
    {
      id: 'Restructuring Balances',
      title: 'Restructuring Balances',
      icon: 'currency-inr' 
    },
    {
      id: 'agent',
      title: 'Settlement Balances',
      icon: 'account-tie' 
    },
  ];

 const AgentCard = ({ agent, index }) => (
     <Card style={[styles.agentCard,  styles.agentCardSpacing]}>
       <View style={styles.agentCardContent}>
         {/* Header with status and code */}
         <View style={styles.agentCardHeader}>
           <View style={styles.statusContainer}>
             <View style={[styles.statusDot, { backgroundColor: agent.status === 'ACTIVE' ? '#4CAF50' : '#F44336' }]} />
             <Text style={[styles.statusText, { color: agent.status === 'ACTIVE' ? '#4CAF50' : '#F44336' }]}>
               {agent.status}
             </Text>
           </View>
           <Text style={styles.agentCode}>#{agent.code}</Text>
         </View>
 
         {/* Agent Info */}
         <View style={styles.agentInfo}>
           <View style={styles.agentAvatarContainer}>
             <View style={styles.agentAvatar}>
               <Icon name="account" size={24} color="#2196F3" />
             </View>
             <View style={styles.agentBasicInfo}>
               <Text style={styles.agentName}>{agent.name}</Text>
               <Text style={styles.agentCompany}>{agent.company}</Text>
              
             </View>
           </View>
         </View>
 
         {/* Details Grid */}
         <View style={styles.agentDetailsGrid}>
           <View style={styles.agentDetailRow}>
             <View style={styles.agentDetailItem}>
               <Icon name="phone" size={16} color="#757575" style={styles.agentDetailIcon} />
               <View>
                 <Text style={styles.agentDetailLabel}>Contact</Text>
                 <Text style={styles.agentDetailValue}>{agent.contactNumber}</Text>
               </View>
             </View>
             <View style={styles.agentDetailItem}>
               <Icon name="email" size={16} color="#757575" style={styles.agentDetailIcon} />
               <View>
                 <Text style={styles.agentDetailLabel}>Email</Text>
                 <Text style={styles.agentDetailValue} numberOfLines={1}>{agent.email}</Text>
               </View>
             </View>
           </View>
 
           <View style={styles.agentDetailRow}>
             <View style={styles.agentDetailItem}>
               <Icon name="calendar" size={16} color="#757575" style={styles.agentDetailIcon} />
               <View>
                 <Text style={styles.agentDetailLabel}>Experience</Text>
                 <Text style={styles.agentDetailValue}>{agent.experience}</Text>
               </View>
             </View>
             <View style={styles.agentDetailItem}>
               <Icon name="medal" size={16} color="#757575" style={styles.agentDetailIcon} />
               <View>
                 <Text style={styles.agentDetailLabel}>Specialization</Text>
                 <Text style={styles.agentDetailValue} numberOfLines={1}>{agent.specialization}</Text>
               </View>
             </View>
           </View>
 
           <View style={styles.agentDetailFullRow}>
             <Icon name="office-building" size={16} color="#757575" style={styles.agentDetailIcon} />
             <View style={styles.agentDetailContent}>
               <Text style={styles.agentDetailLabel}>Service Branch</Text>
               <Text style={styles.agentDetailValue}>{agent.serviceBranch}</Text>
             </View>
           </View>
         </View>
 
         {/* Action Buttons */}
         <View style={styles.agentActions}>
           <TouchableOpacity style={styles.actionButton}>
             <Icon name="phone" size={18} color="#2196F3" />
             <Text style={styles.actionButtonText}>Call</Text>
           </TouchableOpacity>
           <TouchableOpacity style={styles.actionButton}>
             <Icon name="email" size={18} color="#2196F3" />
             <Text style={styles.actionButtonText}>Email</Text>
           </TouchableOpacity>
           <TouchableOpacity style={styles.actionButton}>
             <Icon name="message" size={18} color="#2196F3" />
             <Text style={styles.actionButtonText}>Message</Text>
           </TouchableOpacity>
         </View>
       </View>
     </Card>

   );

  const renderAgentDetails = () => (
    <View style={styles.agentDetailsContent}>
       {/* <FlatList
      data={agentDetails}
      keyExtractor={(item) => item.id.toString()}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      
      renderItem={({ item, index }) => (
        <AgentCard key={item.id} agent={item} index={index} />
      )}
    /> */}
                          {agentDetails.map((agent, index) => (
        <AgentCard key={agent.index} agent={agent} index={index} />
      ))}
    </View>

  );


  const SectionItem = ({ section }) => (
    <View style={styles.sectionContainer}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => toggleSection(section.id)}
        activeOpacity={0.7}
      >
        <View style={styles.sectionLeft}>
          <Icon name={section.icon} size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
        <Icon
          name={expandedSections[section.id] ? 'chevron-up' : 'chevron-down'}
          size={24}
          color="#F44336"
        />
      </TouchableOpacity>
      {expandedSections[section.id] && (
        <View style={styles.sectionContent}>
          {section.id === 'agent' ? (
            renderAgentDetails()
          ) : (
            <Text style={styles.sectionContentText}>
              Content for {section.title} would go here...
            </Text>
          )}
        </View>
      )}
      <Divider style={styles.divider} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#E3F2FD" />
      
      {/* Header */}
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation?.goBack()} color={COLORS.primary} />
        <Appbar.Content title="Account Details" titleStyle={styles.headerTitle} />
         
      </Appbar.Header>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
 

        {/* Sections */}
        <View style={styles.sectionsContainer}>
          {sections.map((section) => (
            <SectionItem key={section.id} section={section} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    // backgroundColor: '#F5F5F5',
    elevation: 0,
    shadowOpacity: 0,
      backgroundColor: '#E3F2FD',
      paddingBottom:30,
      paddingTop:30,
      height:100,
      borderBottomLeftRadius:50
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary
    
  }, 
  scrollView: {
    flex: 1,
  },
   
  sectionsContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop:20
  },
  sectionContainer: {
    paddingVertical: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 12,
  },
  sectionContent: {
    paddingLeft: 15,
    paddingBottom: 16,
  },
  sectionContentText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  divider: {
    backgroundColor: '#E0E0E0',
    height: 1,
  },
  agentDetailsContent: {
    
    paddingBottom: 16,
  },
  agentRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  agentColumn: {
    flex: 1,
    marginRight: 10,
  },
  agentSingleRow: {
    marginBottom: 16,
  },
  agentLabel: {
    fontSize: 12,
    color: '#898787',
    marginBottom: 4,
    lineHeight: 16,
  },
  agentValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    lineHeight: 18,
  },
  agentCard: {
    backgroundColor: '#FFFFFF',
    // borderRadius: 12,
    // elevation: 2,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 8,
    borderColor:COLORS.primary,
    borderWidth:1.5
    
  },
  agentCardSpacing: {
    marginTop: 16,
  },
  agentCardContent: {
    padding: 10,
  },
  agentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  agentCode: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '500',
  },
  agentInfo: {
    marginBottom: 20,
  },
  agentAvatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  agentBasicInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  agentCompany: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 6,
  },
  ratingText: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '500',
  },
  agentDetailsGrid: {
    marginBottom: 20,
  },
  agentDetailRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  agentDetailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 16,
  },
  agentDetailFullRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  agentDetailIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  agentDetailContent: {
    flex: 1,
  },
  agentDetailLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  agentDetailValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    lineHeight: 16,
  },
  agentActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default AccountDetails;