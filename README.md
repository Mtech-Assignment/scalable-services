# **Digital-Asset Marketplace Application**  
### **Microservice-based Architecture**  

---

## **Scalable Service Assignment 2**  
**Group**: 8  
**Batch**: 2YB  
**Team Members**:  
- Chandan Kumar Shaw  
- Shoaib Ansari  
- Prashant  
- Deepak Kumar Sah
 
---

## **Repository**  
[GitHub Repository Link](https://github.com/Mtech-Assignment/scalable-services) 

---

## **Abstract**  
This project involves the design and implementation of a microservice-based Digital-Asset Marketplace Application that allows users to create, trade, and manage digital assets. The microservice architecture ensures scalability, modularity, and ease of maintenance. The application comprises the following services:  
1. **Authentication Service**  
2. **Digital-Asset Management Service**  
3. **Payment Service**  
4. **Marketplace Service**  

These services are independently deployable and leverage containerization (Docker) and orchestration (Kubernetes) for efficient deployment and high availability.

---

## **Introduction**  

### **Overview of the Application**  
The NFT Marketplace Application allows users to:  
- Create digital assets and store their metadata.  
- List digital assets for sale in the marketplace.  
- Process payments for purchases using cryptocurrency (CSDP Token).  
- Securely authenticate and authorize user actions.  

### **Problem Statement**  
Traditional monolithic systems face challenges such as:  
- Independent service scalability.  
- Deployment delays.  
- Maintenance difficulties as the application grows.  

By adopting a microservices architecture, these issues are mitigated, enabling faster development cycles and independent scaling of individual services.

### **Why Microservices?**  
- **Independent Scaling**: Services scale independently based on resource demands.  
- **Modularity**: Clear separation of concerns for better maintainability and debugging.  
- **Faster Deployments**: Updates to one service don’t impact others.  
- **Technology Flexibility**: Each service can use the most appropriate stack or tools.

---

## **Application Architecture**  

### **High-Level Architecture**  
- **Microservices and Interconnections**:  
  - Authentication, Digital-Asset Management, Payment, and Marketplace services.  
  - REST APIs for synchronous communication.  
  - RabbitMQ for asynchronous communication.  
- **External Integrations**: Blockchain for NFT minting and CSDP token-based payments.  

### **Microservices Overview**  
1. **Authentication Service**:  
   - User management: Registration, login, logout.  
   - Token-based authentication using JWT.  

2. **Digital-Asset Service**:  
   - Creation and minting of digital assets.  
   - Metadata storage (title, description, image link).  
   - Blockchain integration for minting and token storage.  
   - Querying user-owned NFTs.  

3. **Payment Service**:  
   - Processes payments by interacting with blockchain smart contracts.  
   - Supports cryptocurrency transfers and token-based payments.  

4. **Marketplace Service**:  
   - Lists NFTs for sale.  
   - Authenticates and authorizes users via the Authentication Service.  
   - Manages buying, selling, and asset statuses.  
   - Coordinates with the Digital-Asset and Payment services.

---

## **Design Approach**  

### **Decomposition Strategy**  
- Core functionalities were separated into independent microservices using the **Strangler Pattern**.  
- Shared Database Pattern was used for simplified data management since no sensitive data needed hiding between services.  

### **Database Design**  
- **Authentication Service**: Stores user credentials, roles, and tokens.  
- **Digital-Asset Service**: Manages NFT metadata and blockchain references.  
- **Payment Service**: Logs transactions and payment details.  
- **Marketplace Service**: Tracks NFT listings, bids, and sale status.

### **Communication Between Services**  
- **REST APIs**: Synchronous communication for user validation and data retrieval.  
- **Message Queue (RabbitMQ)**: Asynchronous communication for ownership changes after purchase.

---

## **Scalability**  
- Independent scaling for resource-intensive services like Digital-Asset and Payment services.  
- Traffic-heavy operations (e.g., NFT minting) benefit from dedicated scaling.

---
## **Flow Diagram of different service interactions**
![Screenshot 2024-12-05 224703](https://github.com/user-attachments/assets/ec51ad9a-9c6b-4f84-ba64-f5ea1eb763eb)

## **Sequence Diagram of different service interactions**
![Screenshot 2024-12-06 112423](https://github.com/user-attachments/assets/60ed070a-b43a-41e4-a6f0-f440eb986af1)


---

## **Service Features**  

### **Authentication Service**  
| Endpoint       | Method | Description                      | Request Params/Body        | Response           |
|----------------|--------|----------------------------------|----------------------------|--------------------|
| `/register`    | POST   | Registers a new user.           | `{email, password}`        | `201 Created`      |
| `/login`       | POST   | Authenticates a user, issues JWT.| `{email, password}`        | `200 OK, JWT token`|
| `/logout`      | POST   | Logs out the user.              | JWT in header              | `200 OK`           |

### **Digital-Asset Service**  
| Endpoint       | Method | Description                      | Request Params/Body        | Response           |
|----------------|--------|----------------------------------|----------------------------|--------------------|
| `/mint`        | POST   | Mints a new NFT.                | `{metadata, creator}`      | `201 Created`      |
| `/nft/:id`     | GET    | Retrieves NFT metadata by ID.   | NFT ID                     | NFT metadata       |
| `/user/nft`    | GET    | Lists NFTs owned by a user.     | User ID                    | Array of NFTs      |

### **Payment Service**  
| Endpoint       | Method | Description                      | Request Params/Body        | Response           |
|----------------|--------|----------------------------------|----------------------------|--------------------|
| `/approve`     | POST   | Processes a payment for an NFT. | `{buyer, seller, NFT}`     | `200 OK`           |
| `/transaction` | GET    | Fetches payment history.        | User ID                    | List of transactions|

### **Marketplace Service**  
| Endpoint       | Method | Description                      | Request Params/Body        | Response           |
|----------------|--------|----------------------------------|----------------------------|--------------------|
| `/list`        | POST   | Lists an asset for sale.        | `{asset ID, price}`        | `201 Created`      |
| `/:id/buy`     | PUT    | Processes purchase of an asset. | Asset ID                   | `200 OK`           |
| `/listings`    | GET    | Retrieves all listed assets.    | None                       | Array of listings  |
| `/:id/resell`  | PUT    | Processes reselling of an asset.| Asset ID                   | `200 OK`           |

---

## **Workflow**  

### **Asset Creation**  
1. User authenticates via Authentication Service.  
2. Sends request to Digital-Asset Service to create the asset.  

### **Asset Listing on Marketplace**  
1. Digital-Asset Service completes asset creation.  
2. Marketplace Service API is called to list the asset.  

### **Asset Buying**  
1. User authenticates via Authentication Service.  
2. Marketplace Service retrieves asset details from Digital-Asset Service.  
3. Payment Service processes payment and updates ownership via RabbitMQ.  

### **Asset Reselling**  
1. User specifies resale price via Marketplace Service.  
2. Marketplace Service updates asset status and price via RabbitMQ.  

### **Retrieve Marketplace Listings**  
- Public endpoint `/listings` retrieves all listed assets.

---

## **Postman Collection**  
The full API endpoint details can be accessed in the [Postman Collection Repository](https://github.com/Mtech-Assignment/scalable-services/tree/main/services-api-postman-collection).  

