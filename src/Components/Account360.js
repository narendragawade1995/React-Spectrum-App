import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View, Animated, TouchableOpacity, StatusBar, } from "react-native";
import { Text ,Appbar} from "react-native-paper";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Ensure you have this
import Api from "../Utilities/apiService";
import { COLORS } from "../theme/theme";
import Loader from "./Loader";

const Account360New = ({ route ,navigation}) => {
  const [loandata, setLoandata] = useState([]);
  const [data360, set360data] = useState([]);
  const [linkaccount, setLinkaccount] = useState([]);
  const [loader, setLoader] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});


  const [animations] = useState({
    account: new Animated.Value(0),
    loan_details: new Animated.Value(0),
    financial: new Animated.Value(0),
    disposition_summary: new Animated.Value(0),
    resolution: new Animated.Value(0),
    legal: new Animated.Value(0),
    other_loan: new Animated.Value(0),
    collateral: new Animated.Value(0)
    
  });

  useEffect(() => {
    getSecuredLoanViewDetails();
    get360view();
  }, []);

  const getSecuredLoanViewDetails = async () => {
    try {
      const result = await Api.get(`securedloanview/getSecuredLoanViewDetails?LoanAccountNo=${route.params.account_no}&ViewType=Collateral View`);
      setLoandata(result.SecuredLoanViewData || []);
    } catch (error) {
      console.log(error);
      setLoader(false);
    }
  };

  const get360view = async () => {
    try {
      const result = await Api.send(
        { account_number: route.params.account_no, from: route.params.secure ? false : true },
        'secure_borrowerdetails/get360viewData'
      );
      if (result?.[0]?.['Link Loan account number']) {
        setLinkaccount(result[0]['Link Loan account number'].split('<br>'));
      };
      if(result  ){
      set360data(result);
      
    }
      setLoader(false);
    } catch (error) {
      console.log(error);
      setLoader(false);
    }
  };

  const toggleSection = (section) => {
    const isExpanded = expandedSections[section];
    Animated.timing(animations[section], {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();

    setExpandedSections(prev => ({
      ...prev,
      [section]: !isExpanded,
    }));
  };

  const renderExpandableSection = (title, iconName, section, data, color) => {
    console.log(data);
    console.log(title);
    const isExpanded = expandedSections[section];
    const animatedHeight = animations[section].interpolate({
      inputRange: [0, 1],
      outputRange: [0, Object.keys(data).length * 45 ],
    });

    const rotateIcon = animations[section].interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });

    return (
      <View style={[styles.sectionContainer, { borderLeftColor: color }]}>
        <TouchableOpacity
          style={[styles.sectionHeader, { backgroundColor: color + '10' }]}
          onPress={() => toggleSection(section)}
          activeOpacity={0.8}
        >
          <View style={styles.headerContent}>
            <View style={[styles.iconContainer, { backgroundColor: color }]}>
              <Icon name={iconName} size={20} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Animated.View style={{ transform: [{ rotate: rotateIcon }] }}>
              <Icon name="chevron-down" size={22} color="#555" />
            </Animated.View>
          </View>
        </TouchableOpacity>

        <Animated.View style={[styles.sectionContent, { height: animatedHeight }]}>
          <View style={styles.detailsContainer}>
            {Object.entries(data).map(([key, value], index) => (
              <View key={index} style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                </Text>
                <Text style={styles.detailValue}>{value || ''}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.mainctr}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
         {/* <Appbar.Header style={styles.header}>
              <Appbar.BackAction onPress={() => navigation?.goBack()} color={COLORS.white} />
              <Appbar.Content title="Account Details" titleStyle={styles.headerTitle} />
               
            </Appbar.Header> */}
      {data360?.length > 0 && (
        <View style={styles.container}>
            <TouchableOpacity
                    onPress={() => navigation?.goBack()}
                    style={styles.backBtn}
                  >
                    <Text style={styles.backIcon}>←</Text>
                  </TouchableOpacity>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>360° View</Text>
            <Text style={styles.accountNumber}>{data360[0]['Account no']}</Text>
            <Text style={styles.accountNumber}>{data360[0]['Name']}</Text>
         
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} >
             {renderExpandableSection('Account Information ', 'account-circle', 'account', data360[0],  COLORS.primary)}
            {renderExpandableSection('Original Loan details', 'card-account-details-outline', 'loan_details', data360[0],  COLORS.primary)}
            {renderExpandableSection('Financial Overview', 'currency-inr', 'financial', data360[0],  COLORS.primary)}
            {renderExpandableSection('Latest Disposition Summary', 'update', 'disposition_summary', data360[0],  COLORS.primary)}
            {renderExpandableSection('Resolution Status', 'check-circle', 'resolution', data360[0],  COLORS.primary)}
            {renderExpandableSection('Legal details', 'gavel', 'legal', data360[0], COLORS.primary)}
            {renderExpandableSection('Other Link loans', 'link-box', 'other_loan', data360[0], COLORS.primary)}
            {Array.isArray(loandata) &&  loandata.length  > 0 && renderExpandableSection('Collateral Details', 'city', 'collateral', loandata[0],  COLORS.primary)}
          </ScrollView>
        </View>
      )}
      {loader && <Loader />}
    </View>
  );
};

const styles = StyleSheet.create({
  mainctr: {
    flex: 1,
    backgroundColor: "#f5f5f5", 
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
    backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 22,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    elevation: 4,
    borderBottomLeftRadius:50,
    borderBottomRightRadius:50
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  accountNumber: {
    fontSize: 16,
    color: '#e3f2fd',
    textAlign: 'center',
    marginTop: 5,
  },
  scrollView: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom:50,
    marginBottom:20

  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    borderLeftWidth: 4,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  sectionContent: {
    overflow: 'hidden',
  },
  detailsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#111',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  }
});

export default Account360New;
