use core::Zeroable;
use core::debug::PrintTrait;
use core::num::traits::Bounded;
use core::option::OptionTrait;
use dojo::model::ModelStorage;
use dojo::world::WorldStorage;
use s1_eternum::alias::ID;
use s1_eternum::models::config::{ProductionConfig};
use s1_eternum::models::config::{TickConfig, TickImpl, TickTrait};
use s1_eternum::models::resource::resource::{Resource, RESOURCE_PRECISION, ResourceImpl, ResourceTypes, ResourceFoodImpl};
use starknet::get_block_timestamp;

#[derive(IntrospectPacked, Copy, Drop, Serde)]
pub struct Production {
    // active building count
    building_count: u8,
    // production rate per tick
    production_rate: u128,
    // labor units left for production
    labor_units_left: u64,
    // last tick updated
    last_updated_tick: u32,
}

// We could make this a nice JS Class with a constructor and everything
// Then maintaining logic in client will be easy
#[generate_trait]
impl ProductionImpl of ProductionTrait {
    fn has_building(self: @Production) -> bool {
        if ((*self).building_count.is_non_zero()) {
            return true;
        }
        return false;
    }

    fn increase_building_count(ref self: Production) {
        self.building_count += 1;
    }

    fn decrease_building_count(ref self: Production) {
        self.building_count -= 1;
    }

    fn increase_production_rate(ref self: Production, production_rate: u128) {
        self.production_rate += production_rate;
    }

    fn decrease_production_rate(ref self: Production, production_rate: u128) {
        self.production_rate -= production_rate;
    }

    fn spend_labor_resource(ref self: Production, production_config: @ProductionConfig, labor_amount: u128) {
        assert!(labor_amount.is_non_zero(), "zero labor amount");
        assert!(
            labor_amount % RESOURCE_PRECISION == 0, "labor amount not exactly divisible by resource precision"
        );
        self.increase_labor_units(labor_amount.try_into().unwrap());
    }

    #[inline(always)]
    fn increase_labor_units(ref self: Production, labor_units: u64) {
        self.labor_units_left += labor_units;
    }

    #[inline(always)]
    fn decrease_labor_units(ref self: Production, labor_units: u64) {
        self.labor_units_left -= labor_units;
    }

    #[inline(always)]
    fn set_last_updated_tick(ref self: Production, tick: u32) {
        self.last_updated_tick = tick;
    }

    #[inline(always)]
    fn is_free_production(resource_type: u8) -> bool {
        return ResourceFoodImpl::is_food(resource_type);
    }

    // function must be called on every resource before querying their balance
    // to ensure that the balance is accurate
    fn harvest(
        ref self: Production, ref resource: Resource, tick: @TickConfig, production_config: @ProductionConfig
    ) -> bool {

        // get start tick before updating last updated tick
        let start_tick = self.last_updated_tick;

        // last updated tick must always be updated
        let current_tick = (*tick).current();
        self.set_last_updated_tick(current_tick.try_into().unwrap());

        // ensure lords can not be produced
        if resource.resource_type == ResourceTypes::LORDS {
            return false;
        }
        // stop if production is not active
        if !self.has_building() {
            return false;
        }
        
        // total units produced by all buildings
        let mut labor_units_burned: u128 
            = (current_tick.into() - start_tick.into())
                    * self.building_count.into();
        
        // limit units produced by labor units left
        if !Self::is_free_production(resource.resource_type) {
            if labor_units_burned > self.labor_units_left.into() {
                labor_units_burned = self.labor_units_left.into();
            }
            // update labor cycles left
            self.decrease_labor_units(labor_units_burned.try_into().unwrap());
        }

        // get total produced amount
        let total_produced_amount: u128 = labor_units_burned * self.production_rate;

        // update resource balance
        resource.add(total_produced_amount);

        // todo add event here
        return total_produced_amount.is_non_zero();
    }
}
