import React, { useEffect, useMemo } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import colors from "../constants/colors";
import useThemeTypography from "../theme/useThemeTypography";
import useLanguage from "../i18n/useLanguage";
import BottomSafeArea from "../components/BottomSafeArea";
export default function SplashScreen({ onComplete }) {  
  const { t } = useTranslation();
  const typography = useThemeTypography();
  const lang = useLanguage();
  useEffect(() => {
    // Auto-navigate after 3 seconds
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleGetStarted = () => {
    if (onComplete) {
      onComplete();
    }
  };

  const bgImage = useMemo(() => require("../assets/images/jomfood-bg.jpg"), []);

  const styles = getStyles(colors, typography);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" translucent />
      {/* Logo */}
      <View style={styles.topSection}>
        <Image
          source={bgImage}
          style={[styles.heroImage]}
          resizeMode="cover"
        />
        <Image style={styles.logoImage} source={require("../assets/images/jomfood.png")} />
        <Image style={styles.foodImage} source={require("../assets/images/food.png")} />
      </View>

      {/* main text container with button */}
      <View style={styles.mainTextContainer}>

      {/* Text Section */}
      <View style={styles.textContainer}>
        {/* if lang is malay reduce some font size */}
        <Text style={[styles.title, lang.currentLanguage === 'malay' ? { fontSize: typography.fontSize['6xl'] - 8 } : {}]}>
          {t('splash.title')} <Text style={styles.specialText}>{t('splash.special')}</Text> {t('splash.titleSuffix')}
        </Text>
        <View style={styles.subTextContainer}>
        <Text style={[styles.subText, lang.currentLanguage === 'malay' ? { fontSize: typography.fontSize.lg - 4 } : {}]}>
          {t('splash.subtitle')}
        </Text>
        {/* Shape */}
        <View style={styles.shape}></View>
        </View>
        {/* add three dots */}
      <View style={styles.dotsContainer}>
        <View style={[styles.dot, styles.dotActive]}></View>
        <View style={styles.dot}></View>
        <View style={styles.dot}></View>
      </View>
      </View>

      {/* Button Container with Safe Area */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>{t('splash.getStarted')}</Text>
        </TouchableOpacity>
      </View>
      </View>
      <BottomSafeArea />
    </SafeAreaView>
  );
}

  const getStyles = (colors, typography) => StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    flex: 0.65,
    marginBottom: 4,
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  logoImage: {
    width: '62%',
    maxWidth: 350,
    height: 'auto',
    aspectRatio: 300/88.5,
    position: "absolute",
    top: "18%",
    //center in screen
    alignSelf: "center",
  },
  foodImage: {
    width: '95%',
    maxWidth: 400,
    height: undefined, // let the image auto-calculate height based on aspect ratio
    aspectRatio: 1.48, // set this to your desired aspect ratio (370/250 ≈ 1.48)
    position: "absolute",
    bottom: "12%",
    alignSelf: "center",
  },
  heroImage: {
     width: "100%",
      height: "100%",
    // resizeMode: "cover",
    position: 'absolute',
    top: undefined,
      bottom: 0,   // 🔥 align image to bottom

    // position bottom like object position bottom in web 
    
  },
  mainTextContainer:{
    flex: 0.35,
    justifyContent: "space-between",
    // backgroundColor:"red"
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 8,
    justifyContent:"center",
    gap:3
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: typography.fontSize['6xl'],
    textAlign: "left",
    lineHeight: 42,
    color: colors.text,
    paddingHorizontal: 20,
    fontFamily: typography.fontFamily.semiBold,
  },
  specialText: {
    color: "#ff7b00",
  },
  subText: {
    fontSize: typography.fontSize.lg,
    color: "#000000",
    paddingHorizontal: 20,
    textAlign: "left",
    marginTop: 10,
    fontFamily: typography.fontFamily.regular, 
    paddingRight: 60,
    
  },
  subTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  shape: {
    //circle with primary color
    width: 32,
    height: 32,
    borderWidth: 8,
    borderColor: colors.primaryLight,
    borderRadius: 50,
    position: "absolute",
    top: 0,
    right: 16,
  },
  button: {
    width: "85%",
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
  },
  dotsContainer: {
    paddingHorizontal: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "left",
    paddingTop:6,
    marginBottom: 2,
    alignSelf: "flex-start"
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: colors.text,
    borderRadius: "50%",
    marginHorizontal: 2
  },
  dotActive: {
    backgroundColor: colors.primaryLight,
  },
});
