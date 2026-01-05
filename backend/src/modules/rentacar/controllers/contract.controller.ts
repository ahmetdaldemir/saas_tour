import { Response } from 'express';
import { ContractService, CreateContractInput, SignContractInput } from '../services/contract.service';
import { ContractTemplateService, CreateContractTemplateInput, UpdateContractTemplateInput } from '../services/contract-template.service';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';

export class ContractController {
  /**
   * Get default template
   * GET /rentacar/contracts/templates/default
   */
  static async getDefaultTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const template = await ContractTemplateService.getDefaultTemplate(tenantId);
      res.json({ success: true, data: template });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * List templates
   * GET /rentacar/contracts/templates
   */
  static async listTemplates(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const templates = await ContractTemplateService.list(tenantId);
      res.json({ success: true, data: templates });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Get template by ID
   * GET /rentacar/contracts/templates/:id
   */
  static async getTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const template = await ContractTemplateService.getById(id, tenantId);

      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }

      res.json({ success: true, data: template });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Create template
   * POST /rentacar/contracts/templates
   */
  static async createTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const template = await ContractTemplateService.create({
        ...req.body,
        tenantId,
      });

      res.status(201).json({ success: true, data: template });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Update template
   * PUT /rentacar/contracts/templates/:id
   */
  static async updateTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const template = await ContractTemplateService.update(id, tenantId, req.body);

      res.json({ success: true, data: template });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Delete template
   * DELETE /rentacar/contracts/templates/:id
   */
  static async deleteTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      await ContractTemplateService.delete(id, tenantId);

      res.json({ success: true, message: 'Template deleted' });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Preview contract (render without saving)
   * POST /rentacar/contracts/preview
   */
  static async previewContract(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { templateId, variables, optionalBlocks } = req.body;

      const template = await ContractTemplateService.getById(templateId, tenantId);
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }

      const { ContractBuilderService } = await import('../services/contract-builder.service');
      const rendered = ContractBuilderService.renderContract({
        template,
        variables: variables || {},
        optionalBlocks: optionalBlocks || [],
      });

      res.json({ success: true, data: rendered });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Create contract
   * POST /rentacar/contracts
   */
  static async createContract(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const contract = await ContractService.create({
        ...req.body,
        tenantId,
        createdByUserId: tenantId, // Using tenantId as fallback
      });

      res.status(201).json({ success: true, data: contract });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Get contract by ID
   * GET /rentacar/contracts/:id
   */
  static async getContract(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const contract = await ContractService.getById(id, tenantId);

      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }

      res.json({ success: true, data: contract });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * List contracts
   * GET /rentacar/contracts
   */
  static async listContracts(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const status = req.query.status as string | undefined;
      const contracts = await ContractService.list(tenantId, status as any);

      res.json({ success: true, data: contracts });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Update contract
   * PUT /rentacar/contracts/:id
   */
  static async updateContract(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const contract = await ContractService.update(id, tenantId, req.body);

      res.json({ success: true, data: contract });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Sign contract
   * POST /rentacar/contracts/:id/sign
   */
  static async signContract(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const contract = await ContractService.signContract(id, tenantId, req.body);

      res.json({
        success: true,
        message: 'Contract signed and PDF generated',
        data: contract,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Generate PDF
   * POST /rentacar/contracts/:id/generate-pdf
   */
  static async generatePDF(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const contract = await ContractService.getById(id, tenantId);

      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }

      const pdfUrl = await ContractService.generateContractPDF(contract);

      res.json({
        success: true,
        message: 'PDF generated',
        data: { pdfUrl },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Generate thermal PDF
   * POST /rentacar/contracts/:id/generate-thermal-pdf
   */
  static async generateThermalPDF(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const contract = await ContractService.getById(id, tenantId);

      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }

      const pdfBuffer = await ContractService.generateThermalPDF(contract);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="contract-${contract.contractNumber}-thermal.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Delete contract
   * DELETE /rentacar/contracts/:id
   */
  static async deleteContract(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      await ContractService.delete(id, tenantId);

      res.json({ success: true, message: 'Contract deleted' });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }
}

