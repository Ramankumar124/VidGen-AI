export default function ProductDetailsForScriptSection({ data, onChange }) {
  return (
    <section className="card">
      <div className="card-header">
        <div className="step-badge">03</div>
        <div>
          <h2 className="card-title">Product Information</h2>
          <p className="card-desc">
            Provide details about your product for script generation.
          </p>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="brandName" className="form-label">
            Brand Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="brandName"
            className="form-input"
            placeholder="e.g., Apple, Nike, Samsung"
            value={data.brand_name || ""}
            onChange={(e) => onChange({ ...data, brand_name: e.target.value })}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="productName" className="form-label">
            Product Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="productName"
            className="form-input"
            placeholder="e.g., iPhone 15 Pro, Air Max 90"
            value={data.product_name || ""}
            onChange={(e) =>
              onChange({ ...data, product_name: e.target.value })
            }
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="priceRange" className="form-label">
            Price Range <span className="required">*</span>
          </label>
          <input
            type="text"
            id="priceRange"
            className="form-input"
            placeholder="e.g., $29.99 - $49.99"
            value={data.price_range || ""}
            onChange={(e) => onChange({ ...data, price_range: e.target.value })}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="category" className="form-label">
            Category <span className="required">*</span>
          </label>
          <input
            type="text"
            id="category"
            className="form-input"
            placeholder="e.g., Electronics, Fashion, Beauty"
            value={data.category || ""}
            onChange={(e) => onChange({ ...data, category: e.target.value })}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="productType" className="form-label">
            Product Type <span className="required">*</span>
          </label>
          <input
            type="text"
            id="productType"
            className="form-input"
            placeholder="e.g., Wireless Earbuds, Coffee Maker"
            value={data.product_type || ""}
            onChange={(e) =>
              onChange({ ...data, product_type: e.target.value })
            }
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="stylingType" className="form-label">
            Styling Type <span className="required">*</span>
          </label>
          <input
            type="text"
            id="stylingType"
            className="form-input"
            placeholder="e.g., Minimalist, Luxury, Modern"
            value={data.styling_type || ""}
            onChange={(e) =>
              onChange({ ...data, styling_type: e.target.value })
            }
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="targetAgeRange" className="form-label">
            Target Age Range <span className="required">*</span>
          </label>
          <input
            type="text"
            id="targetAgeRange"
            className="form-input"
            placeholder="e.g., 18-35, 25-45"
            value={data.target_age_range || ""}
            onChange={(e) =>
              onChange({ ...data, target_age_range: e.target.value })
            }
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="targetGender" className="form-label">
            Target Gender <span className="required">*</span>
          </label>
          <input
            type="text"
            id="targetGender"
            className="form-input"
            placeholder="e.g., All, Male, Female, Non-binary"
            value={data.target_gender || ""}
            onChange={(e) =>
              onChange({ ...data, target_gender: e.target.value })
            }
            required
          />
        </div>

        <div className="form-field form-field-full">
          <label htmlFor="targetBehavior" className="form-label">
            Target Behavior <span className="required">*</span>
          </label>
          <input
            type="text"
            id="targetBehavior"
            className="form-input"
            placeholder="e.g., Tech-savvy, Budget-conscious, Eco-awareness"
            value={data.target_behavior || ""}
            onChange={(e) =>
              onChange({ ...data, target_behavior: e.target.value })
            }
            required
          />
        </div>

        <div className="form-field form-field-full">
          <label htmlFor="sellingLocation" className="form-label">
            Ideal Selling Location <span className="required">*</span>
          </label>
          <input
            type="text"
            id="sellingLocation"
            className="form-input"
            placeholder="e.g., Online stores, Instagram, TikTok"
            value={data.ideal_selling_location || ""}
            onChange={(e) =>
              onChange({ ...data, ideal_selling_location: e.target.value })
            }
            required
          />
        </div>

        <div className="form-field form-field-full">
          <label htmlFor="shortReasoning" className="form-label">
            Short Reasoning <span className="required">*</span>
          </label>
          <textarea
            id="shortReasoning"
            className="form-input form-textarea"
            rows={3}
            placeholder="Why should the target audience buy this product? What's the main benefit?"
            maxLength={300}
            value={data.short_reasoning || ""}
            onChange={(e) =>
              onChange({ ...data, short_reasoning: e.target.value })
            }
            required
          />
          <span className="char-count">
            <span>{(data.short_reasoning || "").length}</span> / 300
          </span>
        </div>
      </div>
    </section>
  );
}
