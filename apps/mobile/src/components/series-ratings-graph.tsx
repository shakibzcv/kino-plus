import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SeriesRatingsGraphData } from '@/services/movies';

export function getRatingColor(rating: number): { bg: string; text: string } {
  if (rating >= 9.7) return { bg: '#0091ff', text: '#ffffff' };
  if (rating >= 9.0) return { bg: '#059669', text: '#ffffff' };
  if (rating >= 8.0) return { bg: '#16a34a', text: '#ffffff' };
  if (rating >= 7.0) return { bg: '#eab308', text: '#000000' };
  if (rating >= 6.0) return { bg: '#ea580c', text: '#ffffff' };
  if (rating >= 5.0) return { bg: '#dc2626', text: '#ffffff' };
  return { bg: '#9333ea', text: '#ffffff' };
}

const RATING_LEGEND = [
  { label: 'Absolute Cinema', range: '≥ 9.7', color: '#0091ff' },
  { label: 'Awesome', range: '9.0–9.6', color: '#059669' },
  { label: 'Great', range: '8.0–8.9', color: '#16a34a' },
  { label: 'Good', range: '7.0–7.9', color: '#eab308' },
  { label: 'Average', range: '6.0–6.9', color: '#ea580c' },
  { label: 'Bad', range: '5.0–5.9', color: '#dc2626' },
  { label: 'Garbage', range: '< 5.0', color: '#9333ea' },
];

export interface SelectedEpisode {
  season: number;
  episode: number;
  name: string;
  rating: number;
  voteCount?: number;
  airDate?: string;
}

interface SeriesRatingsGraphProps {
  data: SeriesRatingsGraphData;
  onSelectEpisode?: (season: number, episode: number) => void;
}

export function SeriesRatingsGraph({ data, onSelectEpisode }: SeriesRatingsGraphProps) {
  const [selectedEp, setSelectedEp] = useState<SelectedEpisode | null>(() => {
    if (data?.seasons?.[0]?.episodes?.[0]) {
      const first = data.seasons[0].episodes[0];
      return {
        season: data.seasons[0].seasonNumber,
        episode: first.episodeNumber,
        name: first.name,
        rating: first.rating,
        voteCount: first.voteCount,
        airDate: first.airDate,
      };
    }
    return null;
  });

  const scrollRef = useRef<any>(null);

  if (!data || !data.seasons || data.seasons.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="stats-chart-outline" size={32} color="#5a6070" />
        <Text style={styles.emptyText}>No episode ratings data available for this series.</Text>
      </View>
    );
  }

  const { seasons, maxEpisodes, overallAverage } = data;

  return (
    <View style={styles.container}>
      {/* Top Header Row: Legend & Overall Average */}
      <View style={styles.headerRow}>
        <View style={styles.avgBadge}>
          <Ionicons name="star" size={13} color="#f59e0b" />
          <Text style={styles.avgText}>
            {overallAverage > 0 ? overallAverage.toFixed(1) : '—'} Overall Avg
          </Text>
        </View>

        {/* Scroll Helper Buttons */}
        <View style={styles.scrollButtonsRow}>
          <Pressable
            onPress={() => scrollRef.current?.scrollTo({ x: 0, animated: true })}
            style={({ pressed }) => [styles.scrollBtn, pressed && styles.pressed]}
            hitSlop={8}
            accessibilityLabel="Scroll to start"
          >
            <Ionicons name="chevron-back" size={16} color="#ffffff" />
          </Pressable>
          <Pressable
            onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
            style={({ pressed }) => [styles.scrollBtn, pressed && styles.pressed]}
            hitSlop={8}
            accessibilityLabel="Scroll to end"
          >
            <Ionicons name="chevron-forward" size={16} color="#ffffff" />
          </Pressable>
        </View>
      </View>

      {/* Rating Color Legend Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.legendContainer}
        style={styles.legendScrollView}
      >
        {RATING_LEGEND.map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendLabel}>{item.label}</Text>
            <Text style={styles.legendRange}>{item.range}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Selected Episode Banner Card */}
      <View style={styles.selectedBanner}>
        {selectedEp ? (
          <View style={styles.selectedContent}>
            <View style={styles.selectedDetails}>
              <View style={styles.selectedEpBadgeRow}>
                <View style={styles.seasonEpPill}>
                  <Text style={styles.seasonEpText}>
                    S{selectedEp.season} E{selectedEp.episode}
                  </Text>
                </View>
                <View
                  style={[
                    styles.ratingPill,
                    { backgroundColor: getRatingColor(selectedEp.rating).bg },
                  ]}
                >
                  <Ionicons
                    name="star"
                    size={11}
                    color={getRatingColor(selectedEp.rating).text}
                  />
                  <Text
                    style={[
                      styles.ratingPillText,
                      { color: getRatingColor(selectedEp.rating).text },
                    ]}
                  >
                    {selectedEp.rating > 0 ? selectedEp.rating.toFixed(1) : 'N/A'}
                  </Text>
                </View>
                {selectedEp.airDate ? (
                  <Text style={styles.airDateText}>{selectedEp.airDate}</Text>
                ) : null}
              </View>

              <Text style={styles.episodeTitle} numberOfLines={1}>
                {selectedEp.name || `Episode ${selectedEp.episode}`}
              </Text>
            </View>

            {onSelectEpisode && (
              <Pressable
                onPress={() => onSelectEpisode(selectedEp.season, selectedEp.episode)}
                style={({ pressed }) => [styles.playBtn, pressed && styles.pressed]}
                hitSlop={6}
              >
                <Ionicons name="play" size={14} color="#ffffff" />
                <Text style={styles.playBtnText}>Play</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.promptRow}>
            <Ionicons name="information-circle-outline" size={16} color="#8c93a4" />
            <Text style={styles.promptText}>Tap any episode cell to inspect rating and play</Text>
          </View>
        )}
      </View>

      {/* Matrix Table with Horizontal Scroll */}
      <View style={styles.matrixWrapper}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.matrixContainer}
        >
          <View>
            {/* Header Row: Column Numbers E1..E_max and Avg */}
            <View style={styles.row}>
              <View style={styles.seasonColHeader}>
                <Text style={styles.colHeaderText}>Season</Text>
              </View>
              {Array.from({ length: maxEpisodes }).map((_, i) => (
                <View key={`header-e${i + 1}`} style={styles.epColHeader}>
                  <Text style={styles.colHeaderText}>E{i + 1}</Text>
                </View>
              ))}
              <View style={styles.avgColHeader}>
                <Text style={styles.colHeaderTextBold}>Avg</Text>
              </View>
            </View>

            {/* Seasons Rows */}
            {seasons.map((season) => (
              <View key={`season-${season.seasonNumber}`} style={styles.row}>
                {/* Season Label */}
                <View style={styles.seasonLabelCell}>
                  <Text style={styles.seasonLabelText}>S{season.seasonNumber}</Text>
                </View>

                {/* Episode Rating Cells */}
                {Array.from({ length: maxEpisodes }).map((_, epIdx) => {
                  const epNum = epIdx + 1;
                  const ep = season.episodes.find((e) => e.episodeNumber === epNum);

                  if (!ep || ep.rating <= 0) {
                    return (
                      <View key={`empty-${season.seasonNumber}-${epNum}`} style={styles.emptyCell} />
                    );
                  }

                  const isSelected =
                    selectedEp?.season === season.seasonNumber &&
                    selectedEp?.episode === ep.episodeNumber;
                  const colorInfo = getRatingColor(ep.rating);

                  return (
                    <Pressable
                      key={`ep-${season.seasonNumber}-${epNum}`}
                      onPress={() => {
                        setSelectedEp({
                          season: season.seasonNumber,
                          episode: ep.episodeNumber,
                          name: ep.name,
                          rating: ep.rating,
                          voteCount: ep.voteCount,
                          airDate: ep.airDate,
                        });
                      }}
                      style={({ pressed }) => [
                        styles.cell,
                        { backgroundColor: colorInfo.bg },
                        isSelected && styles.cellSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={[styles.cellText, { color: colorInfo.text }]}>
                        {ep.rating.toFixed(1)}
                      </Text>
                    </Pressable>
                  );
                })}

                {/* Season Average Cell */}
                <View style={styles.avgCell}>
                  <Text style={styles.avgCellText}>
                    {season.averageRating > 0 ? season.averageRating.toFixed(1) : '—'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    gap: 8,
  },
  emptyText: {
    color: '#8c93a4',
    fontSize: 13,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  avgBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  avgText: {
    color: '#e4e7ec',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scrollBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#181a22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pressed: {
    opacity: 0.7,
  },
  legendScrollView: {
    marginBottom: 12,
  },
  legendContainer: {
    paddingHorizontal: 16,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#12141a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendLabel: {
    color: '#d0d5dd',
    fontSize: 11,
    fontWeight: '600',
  },
  legendRange: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '500',
  },
  selectedBanner: {
    marginHorizontal: 16,
    backgroundColor: '#14161c',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minHeight: 52,
    justifyContent: 'center',
  },
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  selectedDetails: {
    flex: 1,
    gap: 3,
  },
  selectedEpBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  seasonEpPill: {
    backgroundColor: 'rgba(242, 84, 91, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  seasonEpText: {
    color: '#f2545b',
    fontSize: 11,
    fontWeight: '800',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  ratingPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  airDateText: {
    color: '#6b7280',
    fontSize: 11,
  },
  episodeTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f2545b',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  playBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  promptText: {
    color: '#8c93a4',
    fontSize: 12,
  },
  matrixWrapper: {
    width: '100%',
  },
  matrixContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  seasonColHeader: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  epColHeader: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avgColHeader: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colHeaderText: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '600',
  },
  colHeaderTextBold: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '700',
  },
  seasonLabelCell: {
    width: 44,
    justifyContent: 'center',
  },
  seasonLabelText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
  },
  cell: {
    width: 48,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: {
    borderWidth: 2,
    borderColor: '#ffffff',
    transform: [{ scale: 1.05 }],
  },
  cellText: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyCell: {
    width: 48,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  avgCell: {
    width: 44,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avgCellText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
