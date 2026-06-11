//! Xbox achievements registry — Rust sample.
use std::collections::HashMap;
use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Rarity {
    Common,
    Rare,
    Legendary,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Achievement {
    pub id: String,
    pub title: String,
    pub gamerscore: u32,
    pub rarity: Rarity,
}

pub trait ScoreSink {
    fn award(&mut self, gamertag: &str, points: u32);
}

#[derive(Default)]
pub struct InMemorySink {
    totals: HashMap<String, u32>,
}

impl ScoreSink for InMemorySink {
    fn award(&mut self, gamertag: &str, points: u32) {
        *self.totals.entry(gamertag.to_owned()).or_insert(0) += points;
    }
}

#[derive(Clone)]
pub struct Registry<S: ScoreSink + Send + Sync + 'static> {
    inner: Arc<RwLock<S>>,
}

impl<S: ScoreSink + Send + Sync + 'static> Registry<S> {
    pub fn new(sink: S) -> Self {
        Self { inner: Arc::new(RwLock::new(sink)) }
    }

    pub async fn unlock(&self, gamertag: &str, achievement: &Achievement) -> u32 {
        let mut guard = self.inner.write().await;
        guard.award(gamertag, achievement.gamerscore);
        achievement.gamerscore
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let registry = Registry::new(InMemorySink::default());
    let unlocked = registry.unlock(
        "MajorNelson",
        &Achievement {
            id: "ach-0001".into(),
            title: "First Blood".into(),
            gamerscore: 25,
            rarity: Rarity::Common,
        },
    ).await;
    println!("awarded {unlocked}G");
    Ok(())
}
