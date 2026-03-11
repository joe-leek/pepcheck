import AsyncStorage from '@react-native-async-storage/async-storage';
import { HistoryItem, inferRiskLevel } from '../types';

const MIGRATION_V3_KEY = 'pepcheck_migration_v3_complete';

/**
 * Migrates legacy v2.0 history data to v3.0 format.
 * Runs once on app startup, then sets a flag to prevent re-running.
 * 
 * Backfills missing fields:
 * - risk_level: inferred from trust_score
 * - brand_name: defaults to "Unknown Brand"
 * - peptide_name: defaults to "Unknown Peptide"
 */
export async function runMigrationV3(): Promise<void> {
  try {
    // Check if migration already ran
    const hasRun = await AsyncStorage.getItem(MIGRATION_V3_KEY);
    if (hasRun === 'true') {
      console.log('[Migration] v3 migration already complete, skipping');
      return;
    }

    console.log('[Migration] Starting v3 migration...');

    // Load existing history
    const stored = await AsyncStorage.getItem('pepcheck_history');
    if (!stored) {
      console.log('[Migration] No history found, marking migration complete');
      await AsyncStorage.setItem(MIGRATION_V3_KEY, 'true');
      return;
    }

    const history: HistoryItem[] = JSON.parse(stored);
    let migratedCount = 0;

    // Migrate each item
    const migratedHistory = history.map(item => {
      let needsMigration = false;

      // If risk_level is missing, infer it from trust_score
      if (!item.risk_level) {
        item.risk_level = inferRiskLevel(item.trust_score);
        needsMigration = true;
      }

      // If brand_name is missing, default to "Unknown Brand"
      if (!item.brand_name) {
        item.brand_name = 'Unknown Brand';
        needsMigration = true;
      }

      // If peptide_name is missing, default to "Unknown Peptide"
      if (!item.peptide_name) {
        item.peptide_name = 'Unknown Peptide';
        needsMigration = true;
      }

      // Also migrate fullResult if it exists
      if (item.fullResult) {
        if (!item.fullResult.risk_level) {
          item.fullResult.risk_level = item.risk_level;
          needsMigration = true;
        }
        if (!item.fullResult.brand_name) {
          item.fullResult.brand_name = item.brand_name;
          needsMigration = true;
        }
        if (!item.fullResult.peptide_name) {
          item.fullResult.peptide_name = item.peptide_name;
          needsMigration = true;
        }
        if (!item.fullResult.signals) {
          item.fullResult.signals = { positive: [], negative: [] };
          needsMigration = true;
        }
        if (!item.fullResult.raw_score_breakdown) {
          item.fullResult.raw_score_breakdown = {
            positive_total: item.trust_score,
            negative_count: 0,
          };
          needsMigration = true;
        }
      }

      if (needsMigration) {
        migratedCount++;
      }

      return item;
    });

    // Save migrated history
    await AsyncStorage.setItem('pepcheck_history', JSON.stringify(migratedHistory));

    // Mark migration as complete
    await AsyncStorage.setItem(MIGRATION_V3_KEY, 'true');

    console.log(`[Migration] v3 migration complete. Migrated ${migratedCount}/${history.length} items.`);
  } catch (error) {
    console.error('[Migration] v3 migration failed:', error);
    // Don't mark as complete so it retries on next launch
  }
}
