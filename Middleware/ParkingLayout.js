// middleware/generateParkingBlocks.js
const generateParkingBlocks = ({
  theater_id,
  floor,
  fourWheelerBlocks,
  twoWheelerBlocks,
  capacity_per_block,
  four_wheeler_price,
  two_wheeler_price
}) => {
  const blocks = [];

  // 4-WHEELER BLOCKS
  for (let i = 1; i <= fourWheelerBlocks; i++) {
    const block_id = `4W-B${i}`;
    const slots = Array.from({ length: capacity_per_block }, (_, idx) => ({
      slot_id: `S${idx + 1}`,
      is_held: false,
      is_booked: false,
      hold_expires_at: null
    }));

    blocks.push({
      theater_id,
      block_id,
      floor,
      type: "4-wheeler",
      price: four_wheeler_price,
      slots,
      is_full: false
    });
  }

  // 2-WHEELER BLOCKS
  for (let i = 1; i <= twoWheelerBlocks; i++) {
    const block_id = `2W-B${i}`;
    const slots = Array.from({ length: capacity_per_block }, (_, idx) => ({
      slot_id: `S${idx + 1}`,
      is_held: false,
      is_booked: false,
      hold_expires_at: null
    }));

    blocks.push({
      theater_id,
      block_id,
      floor,
      type: "2-wheeler",
      price: two_wheeler_price,
      slots,
      is_full: false
    });
  }

  return blocks;
};

module.exports = generateParkingBlocks;
