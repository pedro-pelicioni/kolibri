use anchor_lang::prelude::*;

declare_id!("Bybi3nTRCF1CU15BvwLnMA4B27YGs5BuoVXeFzFxfqnF");

/// Kolibri Registry — Proof-of-Existence da rastreabilidade da planta.
///
/// Cada planta/lote vira um PDA `Batch` (1 por planta), namespaced pelo dispensário.
/// O registro ancora o `sha256(payload de origem)` (raiz PoE) e cada evento ancora o
/// `sha256(payload canônico)` (calculado off-chain). O PDA guarda o hash do evento
/// mais recente + a contagem; cada hash é emitido no log `EventRecorded`. O payload
/// completo fica off-chain; on-chain só trafegam hashes + storage_uri (sem PII).
///
/// Custódia: a `authority` é a keypair de serviço (server-custody) que assina e grava
/// os eventos. O `dispensary` é a wallet do dispensário (verificada via SIWS) — dono do
/// NFT Metaplex Core e âncora de proveniência. O NFT é mintado off-chain (API via umi)
/// e vinculado on-chain por `set_asset`.
#[program]
pub mod kolibri_registry {
    use super::*;

    pub fn register_plant(
        ctx: Context<RegisterPlant>,
        batch_id: [u8; 16],
        dispensary: Pubkey,
        origin_event_type: u8,
        origin_hash: [u8; 32],
        storage_uri: String,
    ) -> Result<()> {
        require!(
            (1..=15).contains(&origin_event_type),
            KolibriError::InvalidEventType
        );
        require!(storage_uri.len() <= MAX_URI_LEN, KolibriError::UriTooLong);

        let batch = &mut ctx.accounts.batch;
        batch.authority = ctx.accounts.authority.key();
        batch.dispensary = dispensary;
        batch.batch_id = batch_id;
        batch.origin_event_type = origin_event_type;
        batch.origin_hash = origin_hash;
        batch.event_count = 1;
        batch.last_event_hash = origin_hash;
        batch.status = BatchStatus::Active as u8;
        batch.asset = Pubkey::default(); // vinculado depois via set_asset
        batch.created_at = Clock::get()?.unix_timestamp;
        batch.bump = ctx.bumps.batch;

        emit!(BatchRegistered {
            batch_id,
            authority: batch.authority,
            dispensary,
            origin_event_type,
            origin_hash,
            storage_uri,
        });
        Ok(())
    }

    pub fn record_event(
        ctx: Context<RecordEvent>,
        event_type: u8,
        payload_hash: [u8; 32],
        storage_uri: String,
    ) -> Result<()> {
        require!(
            (1..=15).contains(&event_type),
            KolibriError::InvalidEventType
        );
        require!(storage_uri.len() <= MAX_URI_LEN, KolibriError::UriTooLong);

        let batch = &mut ctx.accounts.batch;
        require_keys_eq!(
            batch.authority,
            ctx.accounts.authority.key(),
            KolibriError::Unauthorized
        );

        // PoE: o payload_hash (sha256 calculado off-chain) é o registro verificável.
        // Guardamos o hash do evento mais recente + a contagem; o auditor recomputa
        // sha256(canonical) de cada evento e compara com o hash emitido no log.
        batch.last_event_hash = payload_hash;
        batch.event_count = batch
            .event_count
            .checked_add(1)
            .ok_or(KolibriError::Overflow)?;

        match event_type {
            14 => batch.status = BatchStatus::Recalled as u8,
            15 => batch.status = BatchStatus::Destroyed as u8,
            _ => {}
        }

        emit!(EventRecorded {
            batch_id: batch.batch_id,
            event_type,
            payload_hash,
            storage_uri,
            index: batch.event_count - 1,
            last_event_hash: payload_hash,
        });
        Ok(())
    }

    /// Vincula o NFT Metaplex Core (mintado off-chain pela API) a este lote.
    pub fn set_asset(ctx: Context<SetAsset>, asset: Pubkey) -> Result<()> {
        let batch = &mut ctx.accounts.batch;
        require_keys_eq!(
            batch.authority,
            ctx.accounts.authority.key(),
            KolibriError::Unauthorized
        );
        batch.asset = asset;
        emit!(AssetBound {
            batch_id: batch.batch_id,
            asset,
        });
        Ok(())
    }
}

pub const BATCH_SEED: &[u8] = b"batch";
pub const MAX_URI_LEN: usize = 200;

#[derive(Accounts)]
#[instruction(batch_id: [u8; 16], dispensary: Pubkey)]
pub struct RegisterPlant<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Batch::INIT_SPACE,
        seeds = [BATCH_SEED, dispensary.as_ref(), &batch_id],
        bump
    )]
    pub batch: Account<'info, Batch>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordEvent<'info> {
    #[account(
        mut,
        seeds = [BATCH_SEED, batch.dispensary.as_ref(), &batch.batch_id],
        bump = batch.bump
    )]
    pub batch: Account<'info, Batch>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetAsset<'info> {
    #[account(
        mut,
        seeds = [BATCH_SEED, batch.dispensary.as_ref(), &batch.batch_id],
        bump = batch.bump
    )]
    pub batch: Account<'info, Batch>,
    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Batch {
    /// Keypair de serviço (server-custody) — assina e grava eventos.
    pub authority: Pubkey,
    /// Wallet do dispensário (SIWS) — dono do NFT e proveniência. Usada no seed do PDA.
    pub dispensary: Pubkey,
    /// ULID em bytes (round-trip com a string do DB/UI).
    pub batch_id: [u8; 16],
    pub origin_event_type: u8,
    /// sha256 do payload de origem = raiz PoE.
    pub origin_hash: [u8; 32],
    pub event_count: u64,
    /// Hash (sha256) do payload do evento mais recente.
    pub last_event_hash: [u8; 32],
    /// 0 = Active, 1 = Recalled, 2 = Destroyed.
    pub status: u8,
    /// NFT Metaplex Core desta planta (Pubkey::default até ser vinculado).
    pub asset: Pubkey,
    pub created_at: i64,
    pub bump: u8,
}

#[repr(u8)]
pub enum BatchStatus {
    Active = 0,
    Recalled = 1,
    Destroyed = 2,
}

#[event]
pub struct BatchRegistered {
    pub batch_id: [u8; 16],
    pub authority: Pubkey,
    pub dispensary: Pubkey,
    pub origin_event_type: u8,
    pub origin_hash: [u8; 32],
    pub storage_uri: String,
}

#[event]
pub struct EventRecorded {
    pub batch_id: [u8; 16],
    pub event_type: u8,
    pub payload_hash: [u8; 32],
    pub storage_uri: String,
    pub index: u64,
    pub last_event_hash: [u8; 32],
}

#[event]
pub struct AssetBound {
    pub batch_id: [u8; 16],
    pub asset: Pubkey,
}

#[error_code]
pub enum KolibriError {
    #[msg("Tipo de evento inválido (deve ser 1..15)")]
    InvalidEventType,
    #[msg("storage_uri muito longa")]
    UriTooLong,
    #[msg("Authority não autorizada para este lote")]
    Unauthorized,
    #[msg("Overflow no contador de eventos")]
    Overflow,
}
