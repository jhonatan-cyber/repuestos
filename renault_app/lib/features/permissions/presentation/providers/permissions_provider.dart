import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/providers.dart';
import '../../data/permission_model.dart';
import '../../data/permission_repository.dart';

final permissionRepositoryProvider = Provider<PermissionRepository>((ref) {
  return PermissionRepository(ref.watch(dioClientProvider));
});

final permissionsProvider = FutureProvider<List<PermissionModel>>((ref) async {
  return ref.watch(permissionRepositoryProvider).list();
});
