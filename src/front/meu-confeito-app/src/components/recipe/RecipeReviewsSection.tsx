import { memo, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useAuth } from '../../contexts/AuthContext';
import { useThemeMode } from '../../contexts/ThemeContext';
import { useRecipeReviews } from '../../hooks/useRecipeReviews';
import { AppTheme } from '../../theme/themes';
import { RatingCounts, RecipeReviewItem } from '../../types/review';
import { UserAvatar } from '../common/UserAvatar';
import { StarRatingInput } from './StarRatingInput';

export interface RecipeReviewsSectionProps {
  recipeId: string;
  recipeTitle: string;
  isPublished: boolean;
  isOwner: boolean;
  initialUserReview?: RecipeReviewItem | null;
  initialTotalReviews?: number;
  initialAverageRating?: number | string;
  initialRatingCounts?: RatingCounts;
  onReviewChanged?: () => void;
}

export const RecipeReviewsSection = memo(function RecipeReviewsSection({
  recipeId,
  recipeTitle,
  isPublished,
  isOwner,
  initialUserReview,
  initialTotalReviews,
  initialAverageRating,
  initialRatingCounts,
  onReviewChanged,
}: RecipeReviewsSectionProps) {
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const styles = useMemo(() => createStyles(theme, isDesktop), [theme, isDesktop]);

  const {
    reviews,
    totalReviews,
    averageRating,
    ratingCounts,
    userReview,
    isLoadingReviews,
    isSubmittingReview,
    isDeletingReview,
    createReview,
    updateReview,
    deleteReview,
  } = useRecipeReviews({
    recipeId,
    currentUserId: user?.id,
    initialUserReview,
    initialTotalReviews,
    initialAverageRating,
    initialRatingCounts,
  });

  const [selectedRating, setSelectedRating] = useState<number>(0);

  // Sync selected rating when user review is loaded or changed
  const currentRating = selectedRating || userReview?.rating || 0;
  const hasUserReviewed = Boolean(userReview);
  const hasRatingChanged =
    hasUserReviewed && Boolean(selectedRating) && selectedRating !== userReview?.rating;

  const formattedAverage = useMemo(() => {
    const avg = Number(averageRating);
    return isNaN(avg) || avg === 0 ? '0.0' : avg.toFixed(1);
  }, [averageRating]);

  const handleSubmit = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    const ratingToSubmit = selectedRating || userReview?.rating || 0;
    if (!ratingToSubmit || ratingToSubmit < 1 || ratingToSubmit > 5) {
      Alert.alert('Nota Inválida', 'Selecione uma nota de 1 a 5 estrelas para avaliar a receita.');
      return;
    }

    let isSuccess = false;
    if (hasUserReviewed) {
      isSuccess = await updateReview(ratingToSubmit);
    } else {
      isSuccess = await createReview(ratingToSubmit);
    }

    if (isSuccess) {
      setSelectedRating(0);
      if (onReviewChanged) {
        onReviewChanged();
      }
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Remover Avaliação',
      `Deseja realmente remover sua avaliação da receita "${recipeTitle}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            const isSuccess = await deleteReview();
            if (isSuccess) {
              setSelectedRating(0);
              if (onReviewChanged) {
                onReviewChanged();
              }
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.sectionContainer}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <MaterialCommunityIcons name="star-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Avaliações da Receita</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Notas e opiniões deixadas pela comunidade de confeiteiros
        </Text>
      </View>

      <View style={isDesktop ? styles.desktopColumnsRow : styles.mobileFlowContainer}>
        {/* Left Column (Desktop) / Top Section (Mobile): Rating Summary + User's Own Review */}
        <View style={isDesktop ? styles.desktopLeftCol : styles.mobileGroupCol}>
          {/* Main Rating Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryScoreColumn}>
              <Text style={styles.bigScoreText}>{formattedAverage}</Text>
              <View style={styles.averageStarsRow}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const numAvg = Number(averageRating) || 0;
                  const isFilled = star <= Math.round(numAvg);
                  return (
                    <MaterialCommunityIcons
                      key={star}
                      name={isFilled ? 'star' : 'star-outline'}
                      size={18}
                      color={isFilled ? theme.colors.primary : theme.colors.outlineVariant}
                    />
                  );
                })}
              </View>
              <Text style={styles.totalReviewsCount}>
                {totalReviews === 0
                  ? 'Nenhuma avaliação'
                  : `${totalReviews} ${totalReviews === 1 ? 'avaliação' : 'avaliações'}`}
              </Text>
            </View>

            {/* Rating Breakdown Bars */}
            <View style={styles.barsColumn}>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingCounts?.[star as 1 | 2 | 3 | 4 | 5] ?? 0;
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

                return (
                  <View key={star} style={styles.barRow}>
                    <Text style={styles.barStarLabel}>{star} ★</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${percentage}%` }]} />
                    </View>
                    <Text style={styles.barCountLabel}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Interactive Review Interface (When applicable) */}
          <View style={styles.interactionContainer}>
            {!isPublished ? (
              <View style={styles.noticeCard}>
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text style={styles.noticeText}>
                  Esta receita está como rascunho. Apenas receitas publicadas podem receber
                  avaliações.
                </Text>
              </View>
            ) : isOwner ? (
              <View style={styles.noticeCard}>
                <MaterialCommunityIcons
                  name="account-check-outline"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text style={styles.noticeText}>
                  Você é o autor desta receita. Criadores não podem avaliar suas próprias receitas.
                </Text>
              </View>
            ) : !user ? (
              <View style={styles.loginPromptCard}>
                <MaterialCommunityIcons
                  name="star-circle-outline"
                  size={32}
                  color={theme.colors.primary}
                />
                <Text style={styles.loginPromptTitle}>Gostou desta receita?</Text>
                <Text style={styles.loginPromptSubtitle}>
                  Faça login para deixar sua nota de 1 a 5 estrelas e ajudar outros confeiteiros.
                </Text>
                <TouchableOpacity
                  style={styles.loginPromptBtn}
                  onPress={() => router.push('/login')}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Fazer login para avaliar"
                >
                  <Text style={styles.loginPromptBtnText}>Entrar para Avaliar</Text>
                </TouchableOpacity>
              </View>
            ) : isLoadingReviews && userReview === undefined ? (
              <View style={styles.loadingWrapper}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : (
              /* User is logged in, recipe is published, user is not owner */
              <View style={styles.userReviewBox}>
                <View style={styles.userReviewHeader}>
                  <View style={styles.userReviewTitleGroup}>
                    <MaterialCommunityIcons
                      name={hasUserReviewed ? 'star-check' : 'star-plus-outline'}
                      size={20}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.userReviewTitle}>
                      {hasUserReviewed ? 'Sua Avaliação' : 'Deixe sua Avaliação'}
                    </Text>
                  </View>

                  {hasUserReviewed && (
                    <View style={styles.evaluatedBadge}>
                      <Text style={styles.evaluatedBadgeText}>Avaliada</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.userReviewHint}>
                  {hasUserReviewed
                    ? 'Toque nas estrelas caso queira alterar a sua nota para esta receita:'
                    : 'Selecione uma nota de 1 a 5 estrelas para avaliar esta receita:'}
                </Text>

                <View style={styles.starInputWrapper}>
                  <StarRatingInput
                    rating={currentRating}
                    onRatingChange={setSelectedRating}
                    size={36}
                    showLabel={true}
                  />
                </View>

                <View style={styles.actionButtonsRow}>
                  {/* Submit or Update Button */}
                  {(!hasUserReviewed || hasRatingChanged) && (
                    <TouchableOpacity
                      style={[
                        styles.submitReviewBtn,
                        (!currentRating || isSubmittingReview) && styles.submitReviewBtnDisabled,
                      ]}
                      onPress={handleSubmit}
                      disabled={!currentRating || isSubmittingReview}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel={
                        hasUserReviewed ? 'Atualizar avaliação' : 'Salvar avaliação'
                      }
                    >
                      {isSubmittingReview ? (
                        <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                      ) : (
                        <>
                          <MaterialCommunityIcons
                            name={hasUserReviewed ? 'check' : 'star'}
                            size={18}
                            color={theme.colors.onPrimary}
                          />
                          <Text style={styles.submitReviewBtnText}>
                            {hasUserReviewed ? 'Atualizar Nota' : 'Salvar Avaliação'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  {/* Delete Button (If already evaluated) */}
                  {hasUserReviewed && (
                    <TouchableOpacity
                      style={styles.deleteReviewBtn}
                      onPress={handleDelete}
                      disabled={isDeletingReview}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Remover avaliação"
                    >
                      {isDeletingReview ? (
                        <ActivityIndicator size="small" color={theme.colors.error} />
                      ) : (
                        <>
                          <MaterialCommunityIcons
                            name="trash-can-outline"
                            size={18}
                            color={theme.colors.error}
                          />
                          <Text style={styles.deleteReviewBtnText}>Remover Avaliação</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Right Column (Desktop) / Bottom Section (Mobile): Recent Reviews */}
        <View style={isDesktop ? styles.desktopRightCol : undefined}>
          {/* Community Reviews List */}
          <View style={styles.reviewsListContainer}>
            {!isDesktop && <Text style={styles.reviewsListTitle}>Avaliações Recentes</Text>}

            {isLoadingReviews ? (
              <View style={styles.loadingWrapper}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : reviews.length === 0 ? (
              <View style={styles.emptyReviewsCard}>
                <MaterialCommunityIcons
                  name="message-draw"
                  size={32}
                  color={theme.colors.placeholder}
                />
                <Text style={styles.emptyReviewsText}>
                  Nenhuma avaliação registrada ainda. Seja a primeira pessoa a avaliar!
                </Text>
              </View>
            ) : (
              <View style={styles.reviewsCardsList}>
                {reviews.map((rev) => {
                  let formattedDate = '';
                  try {
                    const date = new Date(rev.createdAt);
                    formattedDate = isNaN(date.getTime())
                      ? ''
                      : date.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        });
                  } catch {
                    formattedDate = '';
                  }

                  return (
                    <View key={rev.id} style={styles.reviewItemCard}>
                      <View style={styles.reviewItemHeader}>
                        <View style={styles.reviewItemUser}>
                          <UserAvatar
                            url={rev.user?.pfpUrl}
                            updatedAt={rev.user?.updatedAt || rev.updatedAt}
                            name={rev.user?.name}
                            size={32}
                            fallbackType="initial"
                            fallbackBackgroundColor={theme.colors.primaryContainer}
                            initialTextStyle={{ color: theme.colors.onPrimaryContainer }}
                            borderColor={theme.colors.outlineVariant}
                            borderWidth={1}
                          />
                          <View>
                            <Text style={styles.reviewerName}>
                              {rev.user?.name || 'Confeiteira(o)'}
                            </Text>
                            {Boolean(formattedDate) && (
                              <Text style={styles.reviewDateText}>{formattedDate}</Text>
                            )}
                          </View>
                        </View>

                        <View style={styles.reviewItemStars}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <MaterialCommunityIcons
                              key={s}
                              name={s <= rev.rating ? 'star' : 'star-outline'}
                              size={14}
                              color={
                                s <= rev.rating ? theme.colors.primary : theme.colors.outlineVariant
                              }
                            />
                          ))}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
});

const createStyles = (theme: AppTheme, isDesktop: boolean) =>
  StyleSheet.create({
    sectionContainer: {
      width: '100%',
      marginTop: theme.spacing.space6,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      paddingTop: theme.spacing.space6,
      gap: theme.spacing.space4,
    },
    desktopColumnsRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.space6,
    },
    desktopLeftCol: {
      flex: 1,
      gap: theme.spacing.space4,
    },
    desktopRightCol: {
      flex: 1.15,
      gap: theme.spacing.space4,
    },
    mobileFlowContainer: {
      flexDirection: 'column',
      gap: theme.spacing.space4,
    },
    mobileGroupCol: {
      flexDirection: 'column',
      gap: theme.spacing.space4,
    },
    sectionHeader: {
      gap: 4,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sectionTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 22,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    sectionSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    summaryCard: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: theme.spacing.space4,
      alignItems: 'center',
      gap: theme.spacing.space4,
      ...theme.shadows.soft,
    },
    summaryScoreColumn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingRight: theme.spacing.space3,
      borderRightWidth: 1,
      borderRightColor: theme.colors.outlineVariant,
      minWidth: 110,
    },
    bigScoreText: {
      fontFamily: theme.typography.headlineXl.fontFamily,
      fontSize: 36,
      fontWeight: 'bold',
      color: theme.colors.espressoDark,
      lineHeight: 40,
    },
    averageStarsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      marginVertical: 4,
    },
    totalReviewsCount: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    barsColumn: {
      flex: 1,
      gap: 4,
    },
    barRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    barStarLabel: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      width: 22,
      textAlign: 'right',
    },
    barTrack: {
      flex: 1,
      height: 8,
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderRadius: theme.rounded.full,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: theme.rounded.full,
    },
    barCountLabel: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 11,
      color: theme.colors.placeholder,
      width: 20,
      textAlign: 'left',
    },
    interactionContainer: {
      width: '100%',
    },
    noticeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      padding: theme.spacing.space3,
    },
    noticeText: {
      flex: 1,
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
    },
    loginPromptCard: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: theme.spacing.space4,
      gap: 8,
      ...theme.shadows.soft,
    },
    loginPromptTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      textAlign: 'center',
    },
    loginPromptSubtitle: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      maxWidth: 340,
      lineHeight: 18,
    },
    loginPromptBtn: {
      backgroundColor: theme.colors.primary,
      minHeight: 48,
      paddingHorizontal: 24,
      borderRadius: theme.rounded.default,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 4,
      ...theme.shadows.glow,
    },
    loginPromptBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onPrimary,
    },
    userReviewBox: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: theme.spacing.space4,
      gap: theme.spacing.space3,
      ...theme.shadows.soft,
    },
    userReviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    userReviewTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    userReviewTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 17,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    evaluatedBadge: {
      backgroundColor: theme.colors.chips.success.background,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.rounded.full,
    },
    evaluatedBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.chips.success.text,
      textTransform: 'uppercase',
    },
    userReviewHint: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    starInputWrapper: {
      paddingVertical: 4,
      alignItems: 'center',
    },
    actionButtonsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: theme.spacing.space2,
    },
    submitReviewBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      minHeight: 48,
      paddingHorizontal: 20,
      borderRadius: theme.rounded.default,
      gap: 6,
      ...theme.shadows.glow,
    },
    submitReviewBtnDisabled: {
      opacity: 0.5,
    },
    submitReviewBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onPrimary,
    },
    deleteReviewBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      paddingHorizontal: 16,
      borderRadius: theme.rounded.default,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLow,
      gap: 6,
    },
    deleteReviewBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.error,
    },
    reviewsListContainer: {
      gap: theme.spacing.space3,
      marginTop: isDesktop ? 0 : theme.spacing.space2,
    },
    reviewsListTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    loadingWrapper: {
      paddingVertical: theme.spacing.space4,
      alignItems: 'center',
    },
    emptyReviewsCard: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      padding: theme.spacing.space4,
      gap: 8,
    },
    emptyReviewsText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    reviewsCardsList: {
      gap: theme.spacing.space2,
    },
    reviewItemCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      padding: theme.spacing.space3,
      ...theme.shadows.soft,
    },
    reviewItemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    reviewItemUser: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    reviewerName: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    reviewDateText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.placeholder,
    },
    reviewItemStars: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
  });
