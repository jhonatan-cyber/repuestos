import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/providers.dart';
import '../../data/role_model.dart';
import '../../data/role_repository.dart';

final roleRepositoryProvider = Provider<RoleRepository>((ref) {
  return RoleRepository(ref.watch(dioClientProvider));
});

final rolesProvider = FutureProvider<List<RoleModel>>((ref) async {
  return ref.watch(roleRepositoryProvider).list();
});
