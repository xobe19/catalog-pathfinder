/**
 * @swagger
 * /quote:
 *   post:
 *     summary: Get a quote for a token swap
 *     description: "Takes three arguments in the body: tokenInAddress, tokenOutAddress, and amount. Returns the swap path."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tokenInAddress:
 *                 type: string
 *                 description: Address of the token you are swapping from.
 *               tokenOutAddress:
 *                 type: string
 *                 description: Address of the token you are swapping to.
 *               amount:
 *                 type: string
 *                 description: Amount of the token you are swapping (in wei).
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 path:
 *                   type: array
 *                   description: Array of token addresses representing the swap path.
 *       400:
 *         description: Bad request (invalid parameters)
 *       500:
 *         description: Internal server error
 */
