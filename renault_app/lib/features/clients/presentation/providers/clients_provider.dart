import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/providers.dart';
import '../../data/client_model.dart';
import '../../data/client_repository.dart';

final clientRepositoryProvider = Provider<ClientRepository>((ref) {
  return ClientRepository(ref.watch(dioClientProvider));
});

final clientsProvider = FutureProvider.autoDispose
    .family<List<Client>, String>((ref, search) async {
  return ref.watch(clientRepositoryProvider).list(search: search);
});
