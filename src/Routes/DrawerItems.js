import { DrawerItem } from "@react-navigation/drawer";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Divider, List } from "react-native-paper";
import { COLORS } from '../theme/theme'
import IconManager from "../Utilities/IconManager";
import { StyleSheet } from "react-native";

const NewDrawerLayout = ({ item, index, ...props }) => {
    const navigation = useNavigation();

    return (
        item.Children ? (
            <List.Accordion
                left={props => item.icon && 
                    <IconManager icon={item.icon.name}  color={COLORS.bg} size={20} iconClass="materialicon" style={[styles.listAccordionIcon, { marginRight: 5 }]} />
                // <List.Icon {...props} icon={item.icon.name} style={[styles.listAccordionIcon, { marginRight: 5 }]}  color={COLORS.bg}  />
                }
                style={[styles.listAccordion, { backgroundColor: COLORS.white }]}
                titleStyle={[styles.listAccordionTitle, { color: COLORS.primary }]}
                key={index}
                title={item.label}
                contentStyle={styles.listAccordionContent}
            >
                {item.Children.map((subitem, index) => (
                    <NewDrawerLayout index={index} item={subitem} />
                ))}
            </List.Accordion>
        ) : (
            <List.Item
                titleStyle={styles.listItem}
                key={index}
                title={() => {
                    return <DrawerItem
                        label={item.label}
                        onPress={() => navigation.navigate(item.navigateTo,item.customparam ? {customparam:item.customparam} : {})}
                        labelStyle={styles.drawerItemLabel}
                        icon={({ color, size }) => (
                            <IconManager icon= 'dot-single' color={COLORS.primary} size={size} iconClass="entypo" style={styles.AccordiontitleIcon}/>
                        )}
                    />
                }}
            />
        )
    );
};

const DrawerItems = (props) => {
    
    const Routelist = [
        {
                icon: { name: 'security', class: 'materialicon' }, label: 'Secure', navigateTo: 'Home', Children: [
                { label: 'Borrower Details', navigateTo: 'Home' },
                { label: 'Disposition', navigateTo: 'accountsearch' ,customparam:{'custom_redirect':'Disposition'}},
            ]
        },

        {
            icon: { name: 'security', class: 'antdesign' }, label: 'UnSecure', navigateTo: 'Home', Children: [
                { label: 'Borrower Details', navigateTo: 'Home' },
                { label: 'Disposition', navigateTo: 'accountsearch' ,customparam:{'custom_redirect':'Disposition'}},
            ]
        },
    ]

    return (
        <List.Section style={styles.listSection}>
            {Routelist.map((item, index) => (
                <NewDrawerLayout key={index} item={item} index={index} />
            ))}
        </List.Section>
    );
}

const styles = StyleSheet.create({
    listSection: {
        marginTop: 10,
    },
    listAccordion: {
        borderRadius: 0,
        borderColor:'transparent',
        marginVertical: 4,
        padding:20,
            
    },
    listAccordionIcon: {
        marginTop: 5,
        backgroundColor:COLORS.primary,
        padding:5,
        borderRadius:10,
        // color:COLORS.primary,
        // height:25,
        // width:25
    },
    listAccordionTitle: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    listAccordionContent: {
        // paddingVertical: 8,
    },
    listItem: {
        color: COLORS.black,
        borderRadius: 8,
        // paddingLeft:100,
        // marginVertical: 2, // Reduce vertical margin
        // elevation: 1, // Optionally reduce elevation for a flatter look
        // paddingVertical: 8, // Reduce vertical padding
        // paddingHorizontal: 12, // Adjust horizontal padding if needed
        backgroundColor: COLORS.white,
       
    },
    drawerItemLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color:COLORS.primary
    },
    AccordiontitleIcon:{
        // backgroundColor:COLORS.bg,
        // borderRadius:10,

    }
});

export default DrawerItems;