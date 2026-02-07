import React, { useState } from "react";
import { View, Text, TouchableOpacity, Switch ,StyleSheet} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { COLORS, FONTWEIGHT,SIZES } from "../theme/theme";
 

const DrawerItem = (props) => {
    const { iconName, text, pro, notification } = props;

    const [isEnable, setIsEnable] = useState(false);
    const toggleSwitch = () => setIsEnable((state) => !state);

    return(
        <TouchableOpacity disabled={notification} onPress={() => {}}>
            <View style={styles.container}>
                <View style={styles.row}>
                    <View style={[styles.iconContainer, { backgroundColor: pro ? COLORS.primary : COLORS.bg} ]}>
                        <Icon name={iconName} size={20} color={pro ? COLORS.bg : COLORS.primary} />
                    </View>
                    <Text style={[styles.text, { fontWeight: pro ? FONTWEIGHT.bold : FONTWEIGHT.weight500} ]}>{text}</Text>
                </View>
                <View>
                    {/* {notification ? 
                        <Switch 
                            trackColor={{ false: COLORS.lightGrey, true: COLORS.primary}}
                            thumbColor={isEnable ? COLORS.lightGrey : COLORS.primary}
                            ios_backgroundColor={COLORS.lightGrey}
                            onValueChange={toggleSwitch}
                            value={isEnable}
                        />
                    :  */}
                    <Icon name="chevron-right" size={20} color={COLORS.grey} /> 
                    {/* } */}
                    
                </View>
            </View>
        </TouchableOpacity>
    )
};


const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 10,
        marginHorizontal: 15,
        alignItems: 'center',   
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        backgroundColor: COLORS.bg,
        marginRight: 20,
        padding: 8,
        borderRadius: 10,
    },
    text: {
        color: COLORS.primary,
        fontSize: SIZES.h4,
    }
});

export default DrawerItem;