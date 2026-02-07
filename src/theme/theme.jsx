import { black } from "react-native-paper/lib/typescript/styles/themes/v2/colors";

const { Dimensions } = require("react-native");

const { width, height } = Dimensions.get('window');

export const COLORS = {
    // primary: '#633974',  // 99, 57, 116
    primary:'#264796',
    lightPurple: '#abc9fb',
    grey: '#585656',
    lightGrey: '#DCDADD',
    white: '#FFFFFF',
    title: '#482755',
    label:'#646464',
    card:'#abc9fb',
    cardbg:"#abc9fb",
    // bg:"#f5f9ff",
    bg:'#EEF7FF',
    // bg:'#F0F0F0',
    black: 'black',
    ligt_grey:'#F0F0F0',
    bg_primary:"#f5f5f7",
    geryl:'#f5f5f5'

};

export const SIZES = {
    h1: 20,
    h2: 18,
    h3: 16,
    h4: 14,
    h5: 12,
    h6: 10,

    width,
    height,
};

export const FONTWEIGHT = {
    bold: 'bold',
    normal: 'normal',
    weight500: '500',
    weight700: '700',
};

