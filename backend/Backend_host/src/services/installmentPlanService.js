const installmentPlanRepository = require('../repositories/installmentPlanRepository');
const phoneRepository = require('../repositories/phoneRepository');
const AppError = require('../utils/customError');

class InstallmentPlanService {
    /**
     * Create a new installment plan
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async createPlan(data) {
        const cleanName = data.plan_name.trim();
        const months = Number(data.number_of_months);

        const existing = await installmentPlanRepository.findByName(cleanName);
        if (existing && existing.number_of_months === months) {
            throw new AppError(`An installment plan '${cleanName}' with ${months} months already exists.`, 409);
        }

        const planData = {
            plan_name: cleanName,
            number_of_months: months,
            interest_rate: data.interest_rate !== undefined ? Number(data.interest_rate) : 0.00,
            additional_fee: data.additional_fee !== undefined ? Number(data.additional_fee) : 0.00,
            terms: data.terms ? data.terms.trim() : null,
            is_active: data.is_active !== undefined ? Boolean(data.is_active) : true
        };

        const newPlan = await installmentPlanRepository.create(planData);
        return newPlan;
    }

    /**
     * Retrieve all installment plans
     * @param {Object} [filters]
     * @returns {Promise<Array>}
     */
    async getAllPlans(filters = {}) {
        return await installmentPlanRepository.findAll(filters);
    }

    /**
     * Retrieve an installment plan by ID
     * @param {number|string} id
     * @returns {Promise<Object>}
     */
    async getPlanById(id) {
        const plan = await installmentPlanRepository.findById(id);
        if (!plan) {
            throw new AppError(`Instalment plan with ID ${id} not found.`, 404);
        }
        return plan;
    }

    /**
     * Update an installment plan
     * @param {number|string} id
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async updatePlan(id, data) {
        const existing = await installmentPlanRepository.findById(id);
        if (!existing) {
            throw new AppError(`Instalment plan with ID ${id} not found.`, 404);
        }

        const cleanName = data.plan_name !== undefined ? data.plan_name.trim() : existing.plan_name;
        const months = data.number_of_months !== undefined ? Number(data.number_of_months) : existing.number_of_months;

        // Check for name duplicate conflict
        if (data.plan_name !== undefined || data.number_of_months !== undefined) {
            const duplicate = await installmentPlanRepository.findByName(cleanName);
            if (duplicate && duplicate.installment_plan_id !== Number(id) && duplicate.number_of_months === months) {
                throw new AppError(`Another installment plan with name '${cleanName}' and ${months} months already exists.`, 409);
            }
        }

        const merged = {
            plan_name: cleanName,
            number_of_months: months,
            interest_rate: data.interest_rate !== undefined ? Number(data.interest_rate) : existing.interest_rate,
            additional_fee: data.additional_fee !== undefined ? Number(data.additional_fee) : existing.additional_fee,
            terms: data.terms !== undefined ? (data.terms ? data.terms.trim() : null) : existing.terms,
            is_active: data.is_active !== undefined ? Boolean(data.is_active) : existing.is_active
        };

        const updated = await installmentPlanRepository.update(id, merged);
        return updated;
    }

    /**
     * Toggle active/inactive status
     * @param {number|string} id
     * @returns {Promise<Object>}
     */
    async toggleStatus(id) {
        const existing = await installmentPlanRepository.findById(id);
        if (!existing) {
            throw new AppError(`Instalment plan with ID ${id} not found.`, 404);
        }

        const updated = await installmentPlanRepository.toggleStatus(id);
        return updated;
    }

    /**
     * Delete an installment plan
     * @param {number|string} id
     * @returns {Promise<Object>}
     */
    async deletePlan(id) {
        const existing = await installmentPlanRepository.findById(id);
        if (!existing) {
            throw new AppError(`Instalment plan with ID ${id} not found.`, 404);
        }

        await installmentPlanRepository.delete(id);
        return {
            installment_plan_id: Number(id),
            plan_name: existing.plan_name
        };
    }

    /**
     * Calculate installment options and monthly payments for a specific phone (C-03)
     * @param {number|string} phone_id
     * @returns {Promise<Object>}
     */
    async calculatePhoneInstallments(phone_id) {
        const phone = await phoneRepository.findById(phone_id);
        if (!phone) {
            throw new AppError(`Phone with ID ${phone_id} not found.`, 404);
        }

        const price = Number(phone.price);

        if (!phone.installment_enabled) {
            return {
                phone_id: Number(phone_id),
                phone_name: phone.name,
                phone_price: price,
                installment_enabled: false,
                message: 'Instalment plans are not enabled for this phone model.',
                plans: []
            };
        }

        let plans = [];
        const assignedIds = Array.isArray(phone.installment_plan_ids) ? phone.installment_plan_ids : [];

        if (assignedIds.length > 0) {
            plans = await installmentPlanRepository.findByIds(assignedIds, true);
        } else {
            // If enabled but no specific IDs selected, show all active plans
            plans = await installmentPlanRepository.findAll({ is_active: true });
        }

        const calculatedPlans = plans.map(plan => {
            const rate = Number(plan.interest_rate || 0);
            const fee = Number(plan.additional_fee || 0);
            const months = Number(plan.number_of_months);

            const interestAmount = Number(((price * rate) / 100).toFixed(2));
            const totalPayable = Number((price + interestAmount + fee).toFixed(2));
            const monthlyPayment = Number((totalPayable / months).toFixed(2));

            return {
                installment_plan_id: plan.installment_plan_id,
                plan_name: plan.plan_name,
                number_of_months: months,
                interest_rate: rate,
                interest_amount: interestAmount,
                additional_fee: fee,
                total_payable: totalPayable,
                monthly_payment: monthlyPayment,
                terms: plan.terms
            };
        });

        return {
            phone_id: Number(phone_id),
            phone_name: phone.name,
            phone_price: price,
            installment_enabled: true,
            plans_count: calculatedPlans.length,
            plans: calculatedPlans
        };
    }
}

module.exports = new InstallmentPlanService();

