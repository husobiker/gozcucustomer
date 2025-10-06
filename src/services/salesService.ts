import { supabaseAdmin } from "../lib/supabase";

// Types
export interface Quote {
  id: string;
  name: string;
  customer: string;
  customer_description: string;
  invoice_status: "not_created" | "created";
  status: "awaiting_response" | "approved" | "rejected";
  edit_date: string;
  total_amount: number;
  currency: "TRY" | "USD" | "EUR";
  invoiced_amount: number;
  preparation_date: string;
  due_date: string;
  terms: string;
  items: QuoteItem[];
  created_at: string;
  updated_at: string;
  customer_company?: {
    logo_url?: string;
    name?: string;
    address?: string;
    tax_office?: string;
    tax_no?: string;
    phone?: string;
    email?: string;
  };
}

export interface QuoteItem {
  id: string;
  quote_id?: string;
  service: string;
  quantity: number | string; // Boş string'e izin ver
  unit: string;
  unit_price: number | string; // Boş string'e izin ver
  tax: string;
  total: number;
  isRegistered?: boolean; // Ürün kayıtlı mı?
  isNew?: boolean; // Yeni oluşturulan ürün mü?
}

export interface Invoice {
  id: string;
  invoice_name: string;
  invoice_number: string;
  customer_name: string;
  issue_date: string;
  due_date: string;
  remaining_amount: number;
  total_amount: number;
  status: "Tahsil Edilecek" | "Tahsil Edildi" | "Gecikmiş" | "Proforma";
  invoice_type:
    | "Proforma"
    | "Satış Faturası"
    | "e-Arşiv Fatura"
    | "Ticari e-Fatura"
    | "E-Fatura"
    | "E-İrsaliye"
    | "E-Müstahsil Makbuzu";
  payment_status: "E-POSTALANDI" | "ONAYLANDI" | "BEKLEMEDE" | "";
  category: string;
  label: string;
  is_overdue: boolean;
  overdue_days?: number;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  service: string;
  warehouse: string;
  quantity: number;
  unit: string;
  unit_price: number;
  tax: string;
  total: number;
}

export interface Customer {
  id: string;
  company_name: string;
  short_name: string;
  category: string;
  type: "Tüzel Kişi" | "Gerçek Kişi";
  tax_number: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  balance: number;
  status: "Aktif" | "Pasif";
  created_at: string;
  updated_at: string;
}

export interface AuthorizedPerson {
  id: string;
  customer_id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
}

// Quote Services
export const quoteService = {
  // Get all quotes with pagination and filters
  async getQuotes(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      customer?: string;
    } = {}
  ) {
    const { page = 1, limit = 10, search, status, customer } = params;
    const offset = (page - 1) * limit;

    try {
      let query = supabaseAdmin
        .from("quotes")
        .select(
          `
          *,
          quote_items (*)
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (search) {
        query = query.or(`name.ilike.%${search}%,customer.ilike.%${search}%`);
      }

      if (status) {
        query = query.eq("status", status);
      }

      if (customer) {
        query = query.ilike("customer", `%${customer}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      console.error("Error fetching quotes:", error);
      // Return empty data on error
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  },

  // Get single quote by ID
  async getQuote(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from("quotes")
        .select(
          `
          *,
          quote_items (*)
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching quote:", error);
      throw new Error("Teklif bulunamadı");
    }
  },

  // Create new quote
  async createQuote(
    quoteData: Omit<Quote, "id" | "created_at" | "updated_at">
  ) {
    const { data: quote, error: quoteError } = await supabaseAdmin
      .from("quotes")
      .insert([
        {
          name: quoteData.name,
          customer: quoteData.customer,
          customer_description: quoteData.customer_description,
          invoice_status: quoteData.invoice_status,
          status: quoteData.status,
          edit_date: quoteData.edit_date,
          total_amount: quoteData.total_amount,
          currency: quoteData.currency,
          invoiced_amount: quoteData.invoiced_amount,
          preparation_date: quoteData.preparation_date,
          due_date: quoteData.due_date,
          terms: quoteData.terms,
        },
      ])
      .select()
      .single();

    if (quoteError) throw quoteError;

    // Insert quote items
    if (quoteData.items && quoteData.items.length > 0) {
      const items = quoteData.items.map((item) => ({
        quote_id: quote.id,
        service: item.service,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        tax: item.tax,
        total: item.total,
      }));

      const { error: itemsError } = await supabaseAdmin
        .from("quote_items")
        .insert(items);

      if (itemsError) throw itemsError;
    }

    return quote;
  },

  // Update quote
  async updateQuote(id: string, quoteData: Partial<Quote>) {
    const { data, error } = await supabaseAdmin
      .from("quotes")
      .update({
        name: quoteData.name,
        customer: quoteData.customer,
        customer_description: quoteData.customer_description,
        invoice_status: quoteData.invoice_status,
        status: quoteData.status,
        edit_date: quoteData.edit_date,
        total_amount: quoteData.total_amount,
        currency: quoteData.currency,
        invoiced_amount: quoteData.invoiced_amount,
        preparation_date: quoteData.preparation_date,
        due_date: quoteData.due_date,
        terms: quoteData.terms,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Update quote items if provided
    if (quoteData.items) {
      // Delete existing items
      await supabaseAdmin.from("quote_items").delete().eq("quote_id", id);

      // Insert new items
      if (quoteData.items.length > 0) {
        const items = quoteData.items.map((item) => ({
          quote_id: id,
          service: item.service,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          tax: item.tax,
          total: item.total,
        }));

        const { error: itemsError } = await supabaseAdmin
          .from("quote_items")
          .insert(items);

        if (itemsError) throw itemsError;
      }
    }

    return data;
  },

  // Delete quote
  async deleteQuote(id: string) {
    // Delete quote items first
    await supabaseAdmin.from("quote_items").delete().eq("quote_id", id);

    // Delete quote
    const { error } = await supabaseAdmin.from("quotes").delete().eq("id", id);

    if (error) throw error;
  },
};

// Invoice Services
export const invoiceService = {
  // Get all invoices with pagination and filters
  async getInvoices(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      type?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      type,
      dateFrom,
      dateTo,
    } = params;
    const offset = (page - 1) * limit;

    try {
      let query = supabaseAdmin
        .from("invoices")
        .select(
          `
          *,
          invoice_items (*)
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (search) {
        query = query.or(
          `invoice_name.ilike.%${search}%,invoice_number.ilike.%${search}%,customer_name.ilike.%${search}%`
        );
      }

      if (status) {
        query = query.eq("status", status);
      }

      if (type) {
        query = query.eq("invoice_type", type);
      }

      if (dateFrom) {
        query = query.gte("issue_date", dateFrom);
      }

      if (dateTo) {
        query = query.lte("issue_date", dateTo);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      console.error("Error fetching invoices:", error);
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  },

  // Get single invoice by ID
  async getInvoice(id: string) {
    const { data, error } = await supabaseAdmin
      .from("invoices")
      .select(
        `
        *,
        invoice_items (*)
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new invoice
  async createInvoice(
    invoiceData: Omit<Invoice, "id" | "created_at" | "updated_at">
  ) {
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from("invoices")
      .insert([
        {
          invoice_name: invoiceData.invoice_name,
          invoice_number: invoiceData.invoice_number,
          customer_name: invoiceData.customer_name,
          issue_date: invoiceData.issue_date,
          due_date: invoiceData.due_date,
          remaining_amount: invoiceData.remaining_amount,
          total_amount: invoiceData.total_amount,
          status: invoiceData.status,
          invoice_type: invoiceData.invoice_type,
          payment_status: invoiceData.payment_status,
          category: invoiceData.category,
          label: invoiceData.label,
          is_overdue: invoiceData.is_overdue,
          overdue_days: invoiceData.overdue_days,
        },
      ])
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Insert invoice items
    if (invoiceData.items && invoiceData.items.length > 0) {
      const items = invoiceData.items.map((item) => ({
        invoice_id: invoice.id,
        service: item.service,
        warehouse: item.warehouse,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        tax: item.tax,
        total: item.total,
      }));

      const { error: itemsError } = await supabaseAdmin
        .from("invoice_items")
        .insert(items);

      if (itemsError) throw itemsError;
    }

    return invoice;
  },

  // Update invoice
  async updateInvoice(id: string, invoiceData: Partial<Invoice>) {
    const { data, error } = await supabaseAdmin
      .from("invoices")
      .update({
        invoice_name: invoiceData.invoice_name,
        invoice_number: invoiceData.invoice_number,
        customer_name: invoiceData.customer_name,
        issue_date: invoiceData.issue_date,
        due_date: invoiceData.due_date,
        remaining_amount: invoiceData.remaining_amount,
        total_amount: invoiceData.total_amount,
        status: invoiceData.status,
        invoice_type: invoiceData.invoice_type,
        payment_status: invoiceData.payment_status,
        category: invoiceData.category,
        label: invoiceData.label,
        is_overdue: invoiceData.is_overdue,
        overdue_days: invoiceData.overdue_days,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Update invoice items if provided
    if (invoiceData.items) {
      // Delete existing items
      await supabaseAdmin.from("invoice_items").delete().eq("invoice_id", id);

      // Insert new items
      if (invoiceData.items.length > 0) {
        const items = invoiceData.items.map((item) => ({
          invoice_id: id,
          service: item.service,
          warehouse: item.warehouse,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          tax: item.tax,
          total: item.total,
        }));

        const { error: itemsError } = await supabaseAdmin
          .from("invoice_items")
          .insert(items);

        if (itemsError) throw itemsError;
      }
    }

    return data;
  },

  // Delete invoice
  async deleteInvoice(id: string) {
    // Delete invoice items first
    await supabaseAdmin.from("invoice_items").delete().eq("invoice_id", id);

    // Delete invoice
    const { error } = await supabaseAdmin
      .from("invoices")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};

// Customer Services
export const customerService = {
  // Get all customers with pagination and filters
  async getCustomers(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      type?: string;
      category?: string;
    } = {}
  ) {
    const { page = 1, limit = 10, search, type, category } = params;
    const offset = (page - 1) * limit;

    try {
      let query = supabaseAdmin
        .from("customers")
        .select(
          `
          *,
          authorized_persons (*)
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (search) {
        query = query.or(
          `company_name.ilike.%${search}%,short_name.ilike.%${search}%,tax_number.ilike.%${search}%,email.ilike.%${search}%`
        );
      }

      if (type) {
        query = query.eq("type", type);
      }

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      console.error("Error fetching customers:", error);
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  },

  // Get single customer by ID
  async getCustomer(id: string) {
    const { data, error } = await supabaseAdmin
      .from("customers")
      .select(
        `
        *,
        authorized_persons (*)
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new customer
  async createCustomer(
    customerData: Omit<Customer, "id" | "created_at" | "updated_at">
  ) {
    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .insert([
        {
          company_name: customerData.company_name,
          short_name: customerData.short_name,
          category: customerData.category,
          type: customerData.type,
          tax_number: customerData.tax_number,
          email: customerData.email,
          phone: customerData.phone,
          address: customerData.address,
          city: customerData.city,
          district: customerData.district,
          balance: customerData.balance,
          status: customerData.status,
        },
      ])
      .select()
      .single();

    if (customerError) throw customerError;

    return customer;
  },

  // Update customer
  async updateCustomer(id: string, customerData: Partial<Customer>) {
    const { data, error } = await supabaseAdmin
      .from("customers")
      .update({
        company_name: customerData.company_name,
        short_name: customerData.short_name,
        category: customerData.category,
        type: customerData.type,
        tax_number: customerData.tax_number,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        city: customerData.city,
        district: customerData.district,
        balance: customerData.balance,
        status: customerData.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete customer
  async deleteCustomer(id: string) {
    // Delete authorized persons first
    await supabaseAdmin
      .from("authorized_persons")
      .delete()
      .eq("customer_id", id);

    // Delete customer
    const { error } = await supabaseAdmin
      .from("customers")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // Create authorized person
  async createAuthorizedPerson(personData: Omit<AuthorizedPerson, "id">) {
    const { data, error } = await supabaseAdmin
      .from("authorized_persons")
      .insert([personData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update authorized person
  async updateAuthorizedPerson(
    id: string,
    personData: Partial<AuthorizedPerson>
  ) {
    const { data, error } = await supabaseAdmin
      .from("authorized_persons")
      .update(personData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete authorized person
  async deleteAuthorizedPerson(id: string) {
    const { error } = await supabaseAdmin
      .from("authorized_persons")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};

// Currency Service
export const currencyService = {
  // Get current exchange rates
  async getExchangeRates() {
    try {
      const response = await fetch(
        "https://api.exchangerate-api.com/v4/latest/USD"
      );
      const data = await response.json();

      return {
        usd: {
          try: data.rates.TRY,
          eur: data.rates.EUR,
        },
        eur: {
          try: data.rates.TRY / data.rates.EUR,
          usd: 1 / data.rates.EUR,
        },
      };
    } catch (error) {
      console.error("Exchange rate fetch error:", error);
      // Fallback rates
      return {
        usd: { try: 36.5, eur: 0.85 },
        eur: { try: 43.0, usd: 1.18 },
      };
    }
  },

  // Convert currency
  convertCurrency(amount: number, from: string, to: string, rates: any) {
    if (from === to) return amount;

    const rate = rates[from.toLowerCase()]?.[to.toLowerCase()];
    if (!rate) return amount;

    return amount * rate;
  },
};

// Email Service
export const emailService = {
  // Send quote email
  async sendQuoteEmail(
    quoteId: string,
    recipientEmail: string,
    message?: string
  ) {
    // This would integrate with your email service (SendGrid, AWS SES, etc.)
    console.log("Sending quote email:", { quoteId, recipientEmail, message });
    return { success: true };
  },

  // Send invoice email
  async sendInvoiceEmail(
    invoiceId: string,
    recipientEmail: string,
    message?: string
  ) {
    // This would integrate with your email service
    console.log("Sending invoice email:", {
      invoiceId,
      recipientEmail,
      message,
    });
    return { success: true };
  },

  // Send payment reminder
  async sendPaymentReminder(customerId: string, invoiceId: string) {
    // This would integrate with your email service
    console.log("Sending payment reminder:", { customerId, invoiceId });
    return { success: true };
  },
};
