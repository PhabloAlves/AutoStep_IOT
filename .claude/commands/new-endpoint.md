Create a new FastAPI endpoint for the AutoStep backend. 

Follow these rules:
1. Place the route in the correct file under `backend/routes/` based on domain (os.py, events.py, metrics.py)
2. Use the SQLAlchemy models defined in `backend/models.py` — do not invent new field names, refer to `.claude/rules/data-model.md`
3. Return typed Pydantic response models — never return raw dicts
4. Protect the endpoint with JWT auth (`Depends(get_current_user)`) unless it is the login or upload endpoint
5. Follow the endpoint naming convention in `.claude/rules/architecture.md`

The endpoint to create: $ARGUMENTS
