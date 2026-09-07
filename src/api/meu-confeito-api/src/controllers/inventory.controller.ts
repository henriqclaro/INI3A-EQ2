import type { Request, Response } from 'express';

import type { Role } from '../generated/prisma/client';
import { CreatedResponse, DefaultSuccessResponse } from '../responses/http.success';
import { InventoryService } from '../services/inventory.service';
import type { ApiResponse } from '../types/api.response';
import type { RequestContext } from '../types/context.interface';
import type { InventoryDTO } from '../types/dtos/inventory.dto';

export class InventoryController {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  private extractProps(req: { userId: string; userRole: Role }): RequestContext {
    return {
      userId: req.userId,
      userRole: req.userRole,
    };
  }

  async list(req: Request, res: Response<ApiResponse<InventoryDTO.ListResponse>>) {
    const context = this.extractProps(req);
    const responseData = await this.inventoryService.list(context);

    return new DefaultSuccessResponse(
      res,
      responseData,
      'Inventory items selected successfully',
    ).send();
  }

  async selectByIngredient(
    req: Request,
    res: Response<ApiResponse<InventoryDTO.SelectByIngredientResponse>>,
  ) {
    const context = this.extractProps(req);
    const ingredientId = Number(req.params.ingredientId);
    const responseData = await this.inventoryService.selectByIngredient(context, ingredientId);

    return new DefaultSuccessResponse(
      res,
      responseData,
      'Inventory item selected successfully',
    ).send();
  }

  async registerPurchase(
    req: Request<Record<string, string>, unknown, InventoryDTO.PurchaseRequest>,
    res: Response<ApiResponse<InventoryDTO.PurchaseResponse>>,
  ) {
    const context = this.extractProps(req);
    const responseData = await this.inventoryService.registerPurchase(context, req.body);

    return new CreatedResponse(res, responseData, 'Purchase registered successfully').send();
  }

  async registerAdjustment(
    req: Request<Record<string, string>, unknown, InventoryDTO.AdjustmentRequest>,
    res: Response<ApiResponse<InventoryDTO.AdjustmentResponse>>,
  ) {
    const context = this.extractProps(req);
    const responseData = await this.inventoryService.registerAdjustment(context, req.body);

    return new CreatedResponse(
      res,
      responseData,
      'Stock adjustment registered successfully',
    ).send();
  }

  async registerWaste(
    req: Request<Record<string, string>, unknown, InventoryDTO.WasteRequest>,
    res: Response<ApiResponse<InventoryDTO.WasteResponse>>,
  ) {
    const context = this.extractProps(req);
    const responseData = await this.inventoryService.registerWaste(context, req.body);

    return new CreatedResponse(res, responseData, 'Stock waste registered successfully').send();
  }

  async listTransactions(
    req: Request,
    res: Response<ApiResponse<InventoryDTO.TransactionListResponse>>,
  ) {
    const context = this.extractProps(req);
    const query = req.query as unknown as InventoryDTO.TransactionQueryRequest;
    const responseData = await this.inventoryService.listTransactions(context, query);

    return new DefaultSuccessResponse(
      res,
      responseData,
      'Inventory transactions selected successfully',
    ).send();
  }
}
