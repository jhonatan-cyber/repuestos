import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/providers.dart';
import '../../data/user_model.dart';
import '../../data/user_repository.dart';

final userRepositoryProvider = Provider<UserRepository>((ref) {
  return UserRepository(ref.watch(dioClientProvider));
});

final usersProvider = FutureProvider.autoDispose
    .family<List<UserModel>, String>((ref, search) async {
  return ref.watch(userRepositoryProvider).list(search: search);
});
