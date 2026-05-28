/* eslint-env jest */
import { eventCodeOf, actorOf, timelineFromGateway, passportFromGateway } from '../mappers';

describe('mappers', () => {
  describe('eventCodeOf', () => {
    it('maps event_type numbers 1..15 to the canonical enum', () => {
      expect(eventCodeOf(1)).toBe('SEED_PLANTED');
      expect(eventCodeOf(6)).toBe('HARVEST');
      expect(eventCodeOf(10)).toBe('LAB_RESULT_RELEASED');
      expect(eventCodeOf(11)).toBe('PACKAGED');
      expect(eventCodeOf(13)).toBe('DISPENSED');
      expect(eventCodeOf(15)).toBe('DESTROYED');
    });

    it('falls back to SEED_PLANTED for unknown numbers/undefined', () => {
      expect(eventCodeOf(undefined)).toBe('SEED_PLANTED');
      expect(eventCodeOf(99)).toBe('SEED_PLANTED');
    });

    it('passes through enum strings', () => {
      expect(eventCodeOf('HARVEST')).toBe('HARVEST');
    });
  });

  describe('actorOf', () => {
    it('returns mapped TimelineActor for known roles', () => {
      expect(actorOf('cultivator')).toBe('cultivator');
      expect(actorOf('lab')).toBe('lab');
      expect(actorOf('dispensary')).toBe('dispensary');
      expect(actorOf('carrier')).toBe('logistics');
    });
    it('defaults unknown roles to cultivator', () => {
      expect(actorOf(undefined)).toBe('cultivator');
      expect(actorOf('mystery')).toBe('cultivator');
    });
  });

  describe('timelineFromGateway', () => {
    it('coerces snake_case gateway shape to TimelineEvent[]', () => {
      const raw = [
        {
          event_id: 'evt-1',
          event_type: 6,
          actor_role: 'cultivator',
          location: 'Estufa B-04',
          occurred_at: '2026-03-12T13:24:00Z',
          tx_signature: 'SIG1',
          anchored: true,
        },
      ];
      const events = timelineFromGateway(raw);
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        id: 'evt-1',
        code: 'HARVEST',
        actor: 'cultivator',
        location: 'Estufa B-04',
        txSignature: 'SIG1',
        verified: true,
      });
      expect(events[0].timestamp).toBe('2026-03-12T13:24:00.000Z');
    });
    it('returns empty array for non-array input', () => {
      expect(timelineFromGateway(undefined as unknown as never)).toEqual([]);
      expect(timelineFromGateway(null as unknown as never)).toEqual([]);
    });
  });

  describe('passportFromGateway', () => {
    it('composes a PlantPassport with timeline + proof + lab', () => {
      const passport = passportFromGateway({
        batch: {
          id: '01HXY'.padEnd(26, 'X'),
          cultivar_code: 'HEM:CBD1',
          strain_name: 'Cannatonic CBD',
          created_at: '2026-04-02T11:08:00Z',
          net_weight_grams: 30,
          photo_uri: 'https://x/y.jpg',
          cultivator: {
            name: 'Fazenda Verde',
            cnpj: '42.318.911/0001-04',
            anvisa_license: 'ANVISA-1',
            farm_location: 'Lavras, MG',
          },
        },
        events: [
          {
            event_id: 'evt-1',
            event_type: 1,
            actor_role: 'cultivator',
            occurred_at: '2026-01-08T08:00:00Z',
            tx_signature: 'SIG1',
            event_pda: 'PDA1',
            anchored: true,
          },
          {
            event_id: 'evt-lab',
            event_type: 10,
            actor_role: 'lab',
            occurred_at: '2026-03-30T10:00:00Z',
            tx_signature: 'SIG2',
            event_pda: 'PDA2',
            anchored: true,
            payload: {
              cbd_pct: 18.42,
              thc_pct: 0.18,
              total_cannabinoids_pct: 19.10,
              lab_name: 'Labgen',
              lab_license: 'INMETRO-CRL-1287',
            },
          },
        ],
        cluster: 'devnet',
        programId: 'FZ21S53Rn8Y6ANfccS2waCrkYWh5zfjXK3hkKU5YSkJ8',
      });

      expect(passport.cultivarCode).toBe('HEM:CBD1');
      expect(passport.netWeightGrams).toBe(30);
      expect(passport.timeline).toHaveLength(2);
      expect(passport.timeline[1].code).toBe('LAB_RESULT_RELEASED');
      expect(passport.lab.cbdPct).toBe(18.42);
      expect(passport.lab.labName).toBe('Labgen');
      expect(passport.proof.network).toBe('devnet');
      expect(passport.proof.txSignature).toBe('SIG2'); // last event tx
      expect(passport.proof.explorerUrl).toContain('cluster=devnet');
      expect(passport.verified).toBe(true);
    });
  });
});
