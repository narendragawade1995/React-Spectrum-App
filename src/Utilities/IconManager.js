import React from "react";
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import   MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Fontisto from 'react-native-vector-icons/Fontisto';  
const IconManager = (props) => {
  const { icon, color, size, iconClass ,style} = props;

  const iconList = {
    'ionicon': Ionicons,
    'materialicon': MaterialIcons,
    'antdesign': AntDesign,
    'feather': Feather,
    'entypo':Entypo,
    'materialCommunityIcons':MaterialCommunityIcons,
    'fontisto':Fontisto
  };

  const IconComponent = iconList[iconClass];
  return IconComponent ? (
    <IconComponent style={style} color={color} size={size} name={icon} />
  ) : null;
};

export default IconManager;