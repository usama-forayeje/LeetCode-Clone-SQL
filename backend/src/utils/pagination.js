
export function getPaginationParams(req) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function buildPaginationMeta(totalCount, page, limit) {
  const totalPages = Math.ceil(totalCount / limit);

  return {
    totalCount,
    totalPages,
    currentPage: page,
    pageSize: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}


{/* example usage */}
// export const getAllSheets = asyncHandler(async (req, res) => {
//   const { page, limit, skip } = getPaginationParams(req);

//   const sheets = await db.sheet.findMany({
//     skip: skip,
//     take: limit,
//     orderBy: { createdAt: "desc" },
//   });
//   const pagination = buildPaginationMeta(totalCount, page, limit);
//   res
//     .status(200)
//     .json(
//       new ApiResponse(200, "Sheets fetched successfully", {
//         sheets,
//         pagination,
//       })
//     );
// });