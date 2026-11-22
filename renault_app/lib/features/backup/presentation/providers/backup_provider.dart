import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/providers.dart';
import '../../data/backup_repository.dart';

final backupRepositoryProvider = Provider<BackupRepository>((ref) {
  return BackupRepository(ref.watch(dioClientProvider));
});
