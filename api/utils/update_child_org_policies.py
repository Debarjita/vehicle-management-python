# api/utils/update_child_org_policies.py
from api.models.organization import Organization

async def update_child_org_policies(org):
    """
    Update child organization policies based on parent organization policies
    
    Args:
        org: Organization object to update
    """
    if org.parent_org_id:
        try:
            # Get the parent organization
            parent_org = await Organization.objects.aget(id=org.parent_org_id)
            
            # Propagate policies if not overridden
            if org.fuel_reimbursement_policy == parent_org.fuel_reimbursement_policy:
                org.fuel_reimbursement_policy = parent_org.fuel_reimbursement_policy
                
            if org.speed_limit_policy == parent_org.speed_limit_policy:
                org.speed_limit_policy = parent_org.speed_limit_policy
                
            # Find all child organizations of this parent
            child_orgs = Organization.objects.filter(parent_org=org.parent_org_id)
            
            # Update each child organization with the new policies
            async for child_org in child_orgs:
                # Check if child has overridden policies, if not, update them
                if child_org.fuel_reimbursement_policy == parent_org.fuel_reimbursement_policy:
                    child_org.fuel_reimbursement_policy = parent_org.fuel_reimbursement_policy
                    
                if child_org.speed_limit_policy == parent_org.speed_limit_policy:
                    child_org.speed_limit_policy = parent_org.speed_limit_policy
                    
                # Save the child organization with updated policies
                await child_org.asave()
                
        except Organization.DoesNotExist:
            # Parent organization not found
            pass