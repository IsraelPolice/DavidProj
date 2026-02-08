import { casesService } from '../services/cases.service.js';
import { lawyersService } from '../services/lawyers.service.js';
import { caseTypesService } from '../services/caseTypes.service.js';
import { templatesService } from '../services/templates.service.js';

export class AppState {
  constructor() {
    this.cases = [];
    this.lawyers = [];
    this.caseTypes = [];
    this.templates = [];
    this.currentCase = null;
    this.currentView = 'cases';
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(listener => listener());
  }

  async loadInitialData() {
    try {
      const [lawyers, caseTypes, templates] = await Promise.all([
        lawyersService.getAllLawyers(),
        caseTypesService.getAllCaseTypes(),
        templatesService.getAllTemplates()
      ]);

      this.lawyers = lawyers;
      this.caseTypes = caseTypes;
      this.templates = templates;

      await this.loadCases();
    } catch (error) {
      console.error('Failed to load initial data:', error);
      throw error;
    }
  }

  async loadCases() {
    try {
      this.cases = await casesService.getAllCases();
      this.notify();
    } catch (error) {
      console.error('Failed to load cases:', error);
      throw error;
    }
  }

  async loadCaseById(id) {
    try {
      this.currentCase = await casesService.getCaseById(id);
      this.notify();
    } catch (error) {
      console.error('Failed to load case:', error);
      throw error;
    }
  }

  setCurrentView(view) {
    this.currentView = view;
    this.notify();
  }

  async createCase(caseData) {
    try {
      const newCase = await casesService.createCase(caseData);
      await this.loadCases();
      return newCase;
    } catch (error) {
      console.error('Failed to create case:', error);
      throw error;
    }
  }

  async updateCase(id, updates) {
    try {
      await casesService.updateCase(id, updates);
      await this.loadCases();
      if (this.currentCase && this.currentCase.id === id) {
        await this.loadCaseById(id);
      }
    } catch (error) {
      console.error('Failed to update case:', error);
      throw error;
    }
  }

  async addLawyer(name) {
    try {
      await lawyersService.createLawyer(name);
      this.lawyers = await lawyersService.getAllLawyers();
      this.notify();
    } catch (error) {
      console.error('Failed to add lawyer:', error);
      throw error;
    }
  }

  async deleteLawyer(id) {
    try {
      await lawyersService.deleteLawyer(id);
      this.lawyers = await lawyersService.getAllLawyers();
      this.notify();
    } catch (error) {
      console.error('Failed to delete lawyer:', error);
      throw error;
    }
  }

  async addCaseType(name) {
    try {
      await caseTypesService.createCaseType(name);
      this.caseTypes = await caseTypesService.getAllCaseTypes();
      this.notify();
    } catch (error) {
      console.error('Failed to add case type:', error);
      throw error;
    }
  }

  async deleteCaseType(id) {
    try {
      await caseTypesService.deleteCaseType(id);
      this.caseTypes = await caseTypesService.getAllCaseTypes();
      this.notify();
    } catch (error) {
      console.error('Failed to delete case type:', error);
      throw error;
    }
  }

  async createTemplate(name, steps) {
    try {
      await templatesService.createTemplate(name, steps);
      this.templates = await templatesService.getAllTemplates();
      this.notify();
    } catch (error) {
      console.error('Failed to create template:', error);
      throw error;
    }
  }

  async updateTemplate(id, name, steps) {
    try {
      await templatesService.updateTemplate(id, name, steps);
      this.templates = await templatesService.getAllTemplates();
      this.notify();
    } catch (error) {
      console.error('Failed to update template:', error);
      throw error;
    }
  }

  async deleteTemplate(id) {
    try {
      await templatesService.deleteTemplate(id);
      this.templates = await templatesService.getAllTemplates();
      this.notify();
    } catch (error) {
      console.error('Failed to delete template:', error);
      throw error;
    }
  }
}
