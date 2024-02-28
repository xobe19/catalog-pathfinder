import logUpdate from "log-update";

export async function custom_logger(
  tableA: string[],
  tableB: string[],
  tableC: string[]
) {
  while (true) {
    const tableData = tableA.map((pair, index) => ({
      pairs: pair,
      resa: tableB[index],
      resb: tableC[index],
    }));

    const tableString = `| PAIRS      | RES A  | RES B   |
|------------|--------|---------|
${tableData
  .map(
    (data) =>
      `| ${data.pairs.padEnd(10)} | ${data.resa.padEnd(6)} | ${data.resb.padEnd(
        7
      )} |`
  )
  .join("\n")}`;

    logUpdate(tableString);
  }
}
