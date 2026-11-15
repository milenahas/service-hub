import dados from './dados.json'
import type { SnapshotCompleto } from '../dominio/snapshot.ts'

export const snapshotInicial = dados as unknown as SnapshotCompleto