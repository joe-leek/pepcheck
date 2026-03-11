import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Modal,
  Pressable,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { AnalysisResult, Signal, COLORS, getTrustColor, getRiskColor, getRiskIcon } from '../types';

interface ResultsScreenProps {
  result: AnalysisResult;
  onCheckAnother: () => void;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ResultsScreen({ result, onCheckAnother }: ResultsScreenProps) {
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const badgeAnim = useRef(new Animated.Value(0)).current;
  const signalAnims = useRef<Animated.Value[]>([]).current;
  
  const trustColor = getTrustColor(result.trust_score);
  const riskColor = getRiskColor(result.risk_level);
  
  // Circle dimensions
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Max possible score is 80 (all positives)
  const maxScore = 80;
  const progress = Math.min(result.trust_score / maxScore, 1);

  useEffect(() => {
    // Initialize signal animations
    const totalSignals = result.signals.positive.length + result.signals.negative.length;
    for (let i = signalAnims.length; i < totalSignals; i++) {
      signalAnims.push(new Animated.Value(0));
    }

    // Sequence: fade in -> score circle -> risk badge -> signals
    Animated.sequence([
      // Fade in the container
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Animate score circle (800ms ease-out as specified)
      Animated.timing(scoreAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      // Risk badge pop
      Animated.spring(badgeAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      // Staggered signal list
      Animated.stagger(
        50,
        signalAnims.slice(0, totalSignals).map(anim =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          })
        )
      ),
    ]).start();
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `PepCheck Analysis: ${result.brand_name} ${result.peptide_name}\nTrust Score: ${result.trust_score}/80\nRisk Level: ${result.risk_level}\n\nAnalysed: ${result.url}`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const strokeDashoffset = scoreAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, circumference * (1 - progress)],
  });

  const displayScore = scoreAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, result.trust_score],
  });

  const renderSignalItem = (signal: Signal, index: number, isPositive: boolean) => {
    const animIndex = isPositive ? index : result.signals.positive.length + index;
    const anim = signalAnims[animIndex] || new Animated.Value(1);
    
    return (
      <Animated.View
        key={signal.key}
        style={[
          styles.signalItem,
          {
            opacity: anim,
            transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.signalTouchable}
          onPress={() => setSelectedSignal(signal)}
          activeOpacity={0.7}
        >
          <View style={styles.signalLeft}>
            <Text style={styles.signalIcon}>{isPositive ? '✓' : '⚠'}</Text>
            <View style={styles.signalTextContainer}>
              <Text style={styles.signalLabel}>{signal.label}</Text>
              {signal.evidence && !isPositive && (
                <Text style={styles.signalEvidence} numberOfLines={1}>
                  "{signal.evidence}"
                </Text>
              )}
            </View>
          </View>
          <View style={styles.signalRight}>
            <Text style={[styles.signalPoints, { color: isPositive ? COLORS.trustHigh : COLORS.trustLow }]}>
              {isPositive ? `+${signal.points}` : signal.points}
            </Text>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCheckAnother} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Trust Score Circle */}
          <View style={styles.scoreContainer}>
            <Svg width={size} height={size} style={styles.scoreSvg}>
              <Defs>
                <LinearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={trustColor} stopOpacity="1" />
                  <Stop offset="100%" stopColor={trustColor} stopOpacity="0.6" />
                </LinearGradient>
              </Defs>
              {/* Background circle */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={COLORS.surface}
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Animated progress circle */}
              <AnimatedCircle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="url(#scoreGradient)"
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                rotation="-90"
                origin={`${size / 2}, ${size / 2}`}
              />
            </Svg>
            <View style={styles.scoreTextContainer}>
              <AnimatedText value={displayScore} style={[styles.scoreValue, { color: trustColor }]} />
              <Text style={styles.scoreLabel}>TRUST SCORE</Text>
            </View>
          </View>

          {/* Risk Level Badge */}
          <Animated.View
            style={[
              styles.riskBadge,
              { backgroundColor: riskColor + '20', borderColor: riskColor },
              {
                opacity: badgeAnim,
                transform: [{ scale: badgeAnim }],
              },
            ]}
          >
            <Text style={styles.riskIcon}>{getRiskIcon(result.risk_level)}</Text>
            <Text style={[styles.riskText, { color: riskColor }]}>
              {result.risk_level.toUpperCase()} RISK
            </Text>
            <Text style={styles.riskDetail}>
              {result.raw_score_breakdown.negative_count} red flag{result.raw_score_breakdown.negative_count !== 1 ? 's' : ''} detected
            </Text>
          </Animated.View>

          {/* Brand & Peptide Info */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Brand</Text>
              <Text style={styles.infoValue}>{result.brand_name}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Peptide</Text>
              <Text style={styles.infoValue}>{result.peptide_name}</Text>
            </View>
          </View>

          {/* Positive Signals */}
          {result.signals.positive.length > 0 && (
            <View style={styles.signalSection}>
              <View style={styles.signalHeader}>
                <Text style={styles.signalHeaderText}>POSITIVE SIGNALS</Text>
                <View style={[styles.signalCount, { backgroundColor: COLORS.trustHigh + '20' }]}>
                  <Text style={[styles.signalCountText, { color: COLORS.trustHigh }]}>
                    {result.signals.positive.length}
                  </Text>
                </View>
              </View>
              {result.signals.positive.map((signal, i) => renderSignalItem(signal, i, true))}
            </View>
          )}

          {/* Negative Signals */}
          {result.signals.negative.length > 0 && (
            <View style={styles.signalSection}>
              <View style={styles.signalHeader}>
                <Text style={styles.signalHeaderText}>RED FLAGS</Text>
                <View style={[styles.signalCount, { backgroundColor: COLORS.trustLow + '20' }]}>
                  <Text style={[styles.signalCountText, { color: COLORS.trustLow }]}>
                    {result.signals.negative.length}
                  </Text>
                </View>
              </View>
              {result.signals.negative.map((signal, i) => renderSignalItem(signal, i, false))}
            </View>
          )}

          {/* Disclaimer */}
          <Text style={styles.disclaimer}>{result.disclaimer}</Text>

          {/* Check Another Button */}
          <TouchableOpacity style={styles.checkAnotherButton} onPress={onCheckAnother}>
            <Text style={styles.checkAnotherText}>Check Another Vendor</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      {/* Signal Detail Modal */}
      <Modal
        visible={selectedSignal !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSignal(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedSignal(null)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            
            {selectedSignal && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalIcon}>
                    {selectedSignal.points > 0 ? '✓' : '⚠'}
                  </Text>
                  <Text style={styles.modalTitle}>{selectedSignal.label}</Text>
                  <Text style={[
                    styles.modalPoints,
                    { color: selectedSignal.points > 0 ? COLORS.trustHigh : COLORS.trustLow }
                  ]}>
                    {selectedSignal.points > 0 ? `+${selectedSignal.points}` : selectedSignal.points} points
                  </Text>
                </View>

                <View style={styles.modalDivider} />

                {selectedSignal.rationale ? (
                  <>
                    <Text style={styles.modalSectionTitle}>WHY THIS MATTERS</Text>
                    <Text style={styles.modalRationale}>{selectedSignal.rationale}</Text>
                  </>
                ) : (
                  <Text style={styles.modalRationale}>
                    {selectedSignal.points > 0
                      ? 'This is a positive indicator of vendor quality and transparency.'
                      : 'This is a red flag that may indicate the vendor targets human consumers rather than researchers.'}
                  </Text>
                )}

                {selectedSignal.evidence && (
                  <>
                    <Text style={styles.modalSectionTitle}>EVIDENCE FOUND</Text>
                    <View style={styles.evidenceBox}>
                      <Text style={styles.evidenceText}>"{selectedSignal.evidence}"</Text>
                    </View>
                  </>
                )}

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setSelectedSignal(null)}
                >
                  <Text style={styles.modalButtonText}>Got it</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// Animated number component
function AnimatedText({ value, style }: { value: Animated.AnimatedInterpolation<number>; style: any }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const listener = value.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
    });
    return () => value.removeListener(listener);
  }, [value]);

  return <Text style={style}>{displayValue}</Text>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  shareButton: {
    padding: 8,
  },
  shareText: {
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  scoreSvg: {
    transform: [{ rotate: '0deg' }],
  },
  scoreTextContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  scoreLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginTop: 4,
  },
  riskBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 24,
    gap: 8,
  },
  riskIcon: {
    fontSize: 16,
  },
  riskText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  riskDetail: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  infoSection: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  infoDivider: {
    height: 1,
    backgroundColor: COLORS.surface,
    marginVertical: 8,
  },
  signalSection: {
    marginBottom: 24,
  },
  signalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  signalHeaderText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    fontWeight: '600',
  },
  signalCount: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  signalCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  signalItem: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  signalTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  signalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  signalIcon: {
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  signalTextContainer: {
    flex: 1,
  },
  signalLabel: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  signalEvidence: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  signalRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signalPoints: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  chevron: {
    fontSize: 20,
    color: COLORS.textTertiary,
  },
  disclaimer: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 18,
  },
  checkAnotherButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkAnotherText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.bgSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    color: COLORS.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalPoints: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalDivider: {
    height: 1,
    backgroundColor: COLORS.surface,
    marginVertical: 16,
  },
  modalSectionTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalRationale: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 24,
    marginBottom: 20,
  },
  evidenceBox: {
    backgroundColor: COLORS.bgTertiary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  evidenceText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
