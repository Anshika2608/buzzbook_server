// middleware/generateParkingBlocks.js

const generateParkingFloors = ({
  theater_id,
  floors
}) => {
  const layout = {
    theater_id,
    floors: []
  };

  for (const floorConfig of floors) {
    const {
      floor,
      fourWheelerBlocks,
      twoWheelerBlocks,
      capacity_per_block,
      four_wheeler_price,
      two_wheeler_price
    } = floorConfig;

    const floorData = {
      floor,
      blocks: []
    };

    let blockNum = 1;

    // 4-WHEELER BLOCKS
    for (let i = 1; i <= (fourWheelerBlocks || 0); i++) {
      const slots = Array.from({ length: capacity_per_block }, (_, idx) => ({
        slot_id: `S${idx + 1}`,
        is_held: false,
        is_booked: false,
        hold_expires_at: null
      }));

      floorData.blocks.push({
        block_id: `4W-B${blockNum++}`,
        type: "4-wheeler",
        price: four_wheeler_price,
        slots,
        bookings: [],
        is_full: false
      });
    }

    // 2-WHEELER BLOCKS
    for (let i = 1; i <= (twoWheelerBlocks || 0); i++) {
      const slots = Array.from({ length: capacity_per_block }, (_, idx) => ({
        slot_id: `S${idx + 1}`,
        is_held: false,
        is_booked: false,
        hold_expires_at: null
      }));

      floorData.blocks.push({
        block_id: `2W-B${blockNum++}`,
        type: "2-wheeler",
        price: two_wheeler_price,
        slots,
        bookings: [],
        is_full: false
      });
    }

    layout.floors.push(floorData);
  }

  return layout;
};

module.exports = generateParkingFloors;
